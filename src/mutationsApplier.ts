import { IFileProvider } from "./fileProvider";
import { IFileProviderFactory } from "./fileProviderFactory";
import { IMutation } from "./mutation";
import { IFileMutations } from "./mutationsProvider";
import { IMutator } from "./mutator";
import { IMutatorFactory } from "./mutatorFactory";

/**
 * Applies individual waves of file mutations.
 */
export interface IMutationsApplier {
    /**
     * Applies an iteration of file mutations.
     * 
     * @param mutations   Mutations to be applied to files.
     * @returns A Promise for the file mutations being applied.
     */
    apply(mutations: IFileMutations): Promise<void>;

    /**
     * Applies a file's mutations.
     * 
     * @param fileName   Name of the file.
     * @param mutations   Mutations to be applied to the file.
     * @returns A Promise for applying the file's mutations.
     */
    applyFileMutations(fileName: string, mutations: IMutation[]): Promise<void>;
}

/**
 * Applies individual waves of file mutations.
 */
export class MutationsApplier implements IMutationsApplier {
    /**
     * Creates file providers for files.
     */
    private fileProviderFactory: IFileProviderFactory;

    /**
     * Creates mutators for mutations.
     */
    private mutatorFactory: IMutatorFactory;

    /**
     * Initializes a new instance of the MutationsApplier class.
     * 
     * @param fileProviderFactory   Creates file providers for files.
     * @param mutatorFactory   Creates mutators for mutations.
     */
    public constructor(fileProviderFactory: IFileProviderFactory, mutatorFactory: IMutatorFactory) {
        this.fileProviderFactory = fileProviderFactory;
        this.mutatorFactory = mutatorFactory;
    }

    /**
     * Applies an iteration of file mutations.
     * 
     * @param mutations   Mutations to be applied to files.
     * @returns A Promise for the file mutations being applied.
     */
    public async apply(mutations: IFileMutations): Promise<void> {
        await Promise.all(
            Object.keys(mutations)
                .map((fileName: string): Promise<void> => {
                    return this.applyFileMutations(fileName, mutations[fileName]);
                }));
    }

    /**
     * Applies a file's mutations.
     * 
     * @param fileName   Name of the file.
     * @param mutations   Mutations to be applied to the file.
     * @returns A Promise for applying the file's mutations.
     */
    public async applyFileMutations(fileName: string, mutations: IMutation[]): Promise<void> {
        const mutationsOrdered: IMutation[] = this.orderMutations(mutations);
        const fileProvider: IFileProvider = this.fileProviderFactory(fileName);
        let fileContents: string = await fileProvider.read();

        for (const mutation of mutationsOrdered) {
            const mutator: IMutator<IMutation> | undefined = this.mutatorFactory.generate(mutation.type);
            if (!mutator) {
                // Todo: use a logger
                console.error(`Unknown mutator type: '${mutation.type}'`);
                continue;
            }

            fileContents = mutator.mutate(fileContents, mutation);
        }

        await fileProvider.write(fileContents);
    }

    /**
     * Orders a set of mutations last-to-first, without overlaps.
     * 
     * @param mutations   Mutations to be applied to a file.
     * @returns The mutations in last-to-first order, without overlaps.
     */
    private orderMutations(mutations: IMutation[]): IMutation[] {
        const ordered: IMutation[] = [];
        let lastStart: number = Infinity;

        for (let i: number = mutations.length - 1; i >= 0; i -= 1) {
            const mutation: IMutation = mutations[i];
            if (mutation.range[1] > lastStart) {
                continue;
            }

            lastStart = mutation.range[0];
            ordered.push(mutation);
        }

        return ordered;
    }
}