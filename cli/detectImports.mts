import { Project, ts } from 'ts-morph';
import * as path from 'path';

/**
 * A script to detect local imports (relative or via path aliases like '@/')
 * and get their resolved file paths using the ts-morph library.
 */
async function findLocalImports(filePath: string): Promise<void> {
    try {
        const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');

        // Create a new ts-morph project instance.
        // Crucially, remove the explicit 'compilerOptions' here.
        // This ensures ts-morph fully uses the settings from tsConfigFilePath,
        // including your correct "moduleResolution": "bundler" and "jsx": "react-jsx".
        const project = new Project({
            tsConfigFilePath: tsConfigPath,
        });

        // Add the target source file to the project.
        // It's vital that the target file is covered by tsconfig.json's 'include'.
        const sourceFile = project.addSourceFileAtPath(filePath);

        console.log(`Analyzing file: ${sourceFile.getFilePath()}`);
        console.log('---');

        // Determine the absolute path to your node_modules directory
        const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');

        // Get all import declarations from the file.
        const importDeclarations = sourceFile.getImportDeclarations();

        for (const importDeclaration of importDeclarations) {
            // Get the module specifier (the string after 'from').
            const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

            // Attempt to get the source file it resolves to.
            // ts-morph will now correctly use the tsconfig.json's 'paths'
            // and "moduleResolution": "bundler" for all file types included.
            const resolvedSourceFile = importDeclaration.getModuleSpecifierSourceFile();

            if (resolvedSourceFile) {
                // Get the absolute file path of the resolved source file.
                const resolvedPath = resolvedSourceFile.getFilePath();

                // Check if the resolved path is NOT inside node_modules.
                if (!resolvedPath.includes(nodeModulesPath)) {
                    console.log(`Local Import found: "${moduleSpecifier}"`);
                    console.log(`Resolved path: ${resolvedPath}`);
                    console.log('---');
                }
            } else {
                // Keep this warning, but understand it might show for non-TS/JS files (like .css)
                console.warn(`Warning: Could not resolve import "${moduleSpecifier}". It might be an external dependency, a non-existent file, or a path issue.`);
            }
        }
    } catch (error: any) {
        console.error('An error occurred:', error.message);
        console.error('Please ensure the file path is correct and your `tsconfig.json` is configured properly (especially `include`, `baseUrl`, `paths`, `moduleResolution`).');
        process.exit(1);
    }
}

// Get the file path from the command line arguments.
const filePath = process.argv[2];

if (!filePath) {
    console.error('Please provide a file path as an argument. Example:');
    console.error('  npm run detect-imports -- ./src/your-file.tsx');
    process.exit(1);
}

findLocalImports(path.resolve(filePath));
