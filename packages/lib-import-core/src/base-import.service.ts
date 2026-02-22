/**
 * Base Import Service
 *
 * Abstract base class for domain-specific import services.
 * Implements the Template Method pattern for the import workflow.
 *
 * @module lib-import-core/base-import.service
 */

import { logger as baseLogger } from '@giulio-leone/lib-shared';
import type {
    ImportFile,
    ImportOptions,
    ImportProgress,
    ImportProgressStep,
    AIParseContext,
    ImportContext,
    BaseImportResult,
    ImportServiceConfig,
} from './types';
import { IMPORT_LIMITS } from './types';
import { createMimeRouter } from './mime-router';

/**
 * Abstract base class for domain-specific import services.
 *
 * Implements the Template Method pattern:
 * - Shared logic: validation, parsing orchestration, progress emission
 * - Abstract methods: domain-specific prompt, processing, persistence
 *
 * @template TAIRaw - The raw type returned by AI parsing (what parseWithAI returns)
 * @template TParsed - The internal parsed/wrapped data type after processing (defaults to TAIRaw)
 * @template TResult - The final import result type
 *
 * For most services, TAIRaw and TParsed are the same type. Use different types only when
 * you need to wrap the raw AI output in a richer structure (e.g., adding warnings/stats).
 *
 * @example
 * ```typescript
 * // Simple case: TAIRaw = TParsed
 * class NutritionImportService extends BaseImportService<ImportedNutritionPlan, ImportedNutritionPlan, NutritionImportResult> {
 *   // processParsed receives ImportedNutritionPlan, returns ImportedNutritionPlan
 * }
 *
 * // Advanced case: TAIRaw !== TParsed
 * class WorkoutImportService extends BaseImportService<ImportedWorkoutProgram, ParsedWorkoutData, WorkoutImportResult> {
 *   // processParsed receives ImportedWorkoutProgram, returns ParsedWorkoutData
 * }
 * ```
 */
export abstract class BaseImportService<TAIRaw extends object, TParsed extends object = TAIRaw, TResult extends BaseImportResult = BaseImportResult> {
    protected readonly aiContext: AIParseContext<TAIRaw>;
    protected readonly onProgress?: (progress: ImportProgress) => void;
    protected readonly context: ImportContext;
    protected readonly logger;

    constructor(config: ImportServiceConfig<TAIRaw>) {
        this.aiContext = config.aiContext;
        this.onProgress = config.onProgress;
        this.context = config.context;
        this.logger = baseLogger.child(this.getLoggerName());
    }

    // ==================== TEMPLATE METHOD ====================

    /**
     * Main import workflow (Template Method)
     *
     * Steps:
     * 1. Validate files (shared)
     * 2. Parse with AI (shared routing, domain prompt) -> TAIRaw
     * 3. Process parsed data (domain-specific) -> TParsed
     * 4. Persist to database (domain-specific)
     */
    async import(
        files: ImportFile[],
        userId: string,
        options?: Partial<ImportOptions>
    ): Promise<TResult> {
        const warnings: string[] = [];
        const errors: string[] = [];

        try {
            // Step 1: Validation
            this.emit({
                step: 'validating',
                message: 'Validazione files...',
                progress: 0.1,
            });
            this.validateFiles(files);

            // Step 2: Parsing with AI -> returns TAIRaw
            this.emit({
                step: 'parsing',
                message: 'Parsing con AI...',
                progress: 0.25,
            });
            const rawParsed = await this.parseFiles(files, userId, options);

            // Step 3: Processing -> transforms TAIRaw to TParsed
            this.emit({
                step: 'matching',
                message: 'Elaborazione dati...',
                progress: 0.5,
            });
            const processed = await this.processParsed(rawParsed, userId, options);

            // Step 4: Persistence
            this.emit({
                step: 'persisting',
                message: 'Salvataggio...',
                progress: 0.75,
            });
            const result = await this.persist(processed, userId);

            // Complete
            this.emit({
                step: 'completed',
                message: 'Import completato',
                progress: 1,
            });

            return { ...result, success: true, warnings } as TResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Errore sconosciuto';
            this.logger.error('Import failed', {
                requestId: this.context.requestId,
                userId,
                error: message,
            });
            errors.push(message);

            this.emit({
                step: 'error',
                message: `Errore: ${message}`,
                progress: 0,
            });

            return {
                ...this.createErrorResult(errors),
                success: false,
                errors,
            } as TResult;
        }
    }

    // ==================== ABSTRACT METHODS ====================

    /** Get logger name for this service */
    protected abstract getLoggerName(): string;

    /** Build the AI prompt for parsing */
    protected abstract buildPrompt(options?: Partial<ImportOptions>): string;

    /**
     * Process the raw parsed AI data (domain-specific transformations)
     * Transforms TAIRaw -> TParsed
     */
    protected abstract processParsed(
        parsed: TAIRaw,
        userId: string,
        options?: Partial<ImportOptions>
    ): Promise<TParsed>;

    /**
     * Persist the processed data to database
     */
    protected abstract persist(
        processed: TParsed,
        userId: string
    ): Promise<Partial<TResult>>;

    /**
     * Create an error result for failures
     */
    protected abstract createErrorResult(errors: string[]): Partial<TResult>;

    // ==================== SHARED LOGIC ====================

    /**
     * Validate files before processing
     */
    protected validateFiles(files: ImportFile[]): void {
        if (!files || files.length === 0) {
            throw new Error('Nessun file fornito');
        }

        if (files.length > IMPORT_LIMITS.MAX_FILES) {
            throw new Error(`Massimo ${IMPORT_LIMITS.MAX_FILES} files permessi`);
        }

        for (const file of files) {
            if (file.content.length > IMPORT_LIMITS.MAX_FILE_SIZE) {
                throw new Error(`File ${file.name} supera il limite di ${IMPORT_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`);
            }
        }
    }

    /**
     * Parse files using AI with MIME routing
     * @returns TAIRaw - the raw AI output
     */
    protected async parseFiles(
        files: ImportFile[],
        userId: string,
        options?: Partial<ImportOptions>
    ): Promise<TAIRaw> {
        const prompt = this.buildPrompt(options);

        // Create unified handler that uses AI context
        const handler = async (content: string, mimeType: string): Promise<TAIRaw> => {
            return this.aiContext.parseWithAI(content, mimeType, prompt, userId);
        };

        // Build MIME router with TAIRaw type
        const router = createMimeRouter<TAIRaw>({
            image: handler,
            pdf: handler,
            spreadsheet: handler,
            document: handler,
            fallback: handler,
        });

        // Parse first file (multi-file support can be added per-domain)
        const file = files[0];
        if (!file) {
            throw new Error('Nessun file valido da processare');
        }

        const mimeType = file.mimeType || 'application/octet-stream';
        return router(file.content, mimeType);
    }

    /**
     * Emit progress update
     */
    protected emit(progress: { step: ImportProgressStep; message: string; progress: number }): void {
        this.onProgress?.(progress);
    }
}
