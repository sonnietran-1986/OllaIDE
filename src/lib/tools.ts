import { FunctionDeclaration, Type } from "@google/genai";

export type ToolName = 'view_file' | 'create_file' | 'edit_file' | 'multi_edit_file' | 'shell_exec';

export const agentTools: (FunctionDeclaration & { name: ToolName })[] = [
  {
    name: 'view_file' satisfies ToolName,
    description: 'View the contents of a file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        AbsolutePath: {
          type: Type.STRING,
          description: 'The absolute path to the file to view.',
        },
        StartLine: {
          type: Type.INTEGER,
          description: 'Optional. The line to start viewing at.',
        },
        EndLine: {
          type: Type.INTEGER,
          description: 'Optional. The line to end viewing at.',
        },
      },
      required: ['AbsolutePath'],
    },
  },
  {
    name: 'create_file' satisfies ToolName,
    description: 'Create a new file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        TargetFile: {
          type: Type.STRING,
          description: 'The absolute path of the file to create.',
        },
        Content: {
          type: Type.STRING,
          description: 'The content to write to the file.',
        },
        Overwrite: {
          type: Type.BOOLEAN,
          description: 'Set to true to overwrite if the file already exists.',
        },
      },
      required: ['TargetFile', 'Content', 'Overwrite'],
    },
  },
  {
    name: 'edit_file' satisfies ToolName,
    description: 'Edit an existing file by replacing a specific block of text.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        TargetFile: {
          type: Type.STRING,
          description: 'The absolute path of the file to edit.',
        },
        TargetContent: {
          type: Type.STRING,
          description: 'The exact string to be replaced.',
        },
        ReplacementContent: {
          type: Type.STRING,
          description: 'The content to replace the target content with.',
        },
        Instruction: {
          type: Type.STRING,
          description: 'A short description of the changes.',
        },
      },
      required: ['TargetFile', 'TargetContent', 'ReplacementContent', 'Instruction'],
    },
  },
  {
    name: 'multi_edit_file' satisfies ToolName,
    description: 'Edit an existing file by replacing multiple blocks of text.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        TargetFile: {
          type: Type.STRING,
          description: 'The absolute path of the file to edit.',
        },
        Instruction: {
          type: Type.STRING,
          description: 'A short description of the changes.',
        },
        ReplacementChunks: {
          type: Type.ARRAY,
          description: 'A list of chunks to replace.',
          items: {
            type: Type.OBJECT,
            properties: {
              TargetContent: {
                type: Type.STRING,
                description: 'The exact string to be replaced.',
              },
              ReplacementContent: {
                type: Type.STRING,
                description: 'The content to replace the target content with.',
              },
            },
            required: ['TargetContent', 'ReplacementContent'],
          },
        },
      },
      required: ['TargetFile', 'ReplacementChunks', 'Instruction'],
    },
  },
  {
    name: 'shell_exec' satisfies ToolName,
    description: 'Execute a shell command.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: 'The shell command to execute.',
        },
      },
      required: ['command'],
    },
  },
];
