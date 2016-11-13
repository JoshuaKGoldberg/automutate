import * as fs from "fs";

import { IFileProvider } from "../fileProvider";

/**
 * Provides read-write operations on a local file.
 */
export class LocalFileProvider implements IFileProvider {
    /**
     * Name of the file.
     */
    private readonly fileName: string;

    /**
     * Initializes a new instance of the LocalFileProvider class.
     * 
     * @param fileName   Name of the file.
     */
    public constructor(fileName: string) {
        this.fileName = fileName;
    }

    /**
     * Reads from the file.
     * 
     * @returns A Promise for the contents of the file.
     */
    public read(): Promise<string> {
        return new Promise((resolve, reject): void => {
            fs.readFile(this.fileName, (error: Error, data: Buffer): void => {
                error ? reject(error) : resolve(data.toString());
            });
        });
    }

    /**
     * Writes to the file.
     * 
     * @param contents   New contents of the file.
     * @returns A Promise for writing to the file.
     */
    public write(contents: string): Promise<void> {
        return new Promise((resolve, reject): void => {
            fs.writeFile(this.fileName, contents, (error: Error): void => {
                error ? reject(error) : resolve();
            });
        });
    }

}