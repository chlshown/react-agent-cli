import { webSearch } from './search.js';
import { fetchPage } from './fetch.js';
import { calculator } from './calculator.js';
import { readFileTool, writeFileTool, listFilesTool } from './files.js';

// 工具注册表：Agent 能做什么，全在这里定义
export const tools = {
  webSearch,
  fetchPage,
  calculator,
  readFile: readFileTool,
  writeFile: writeFileTool,
  listFiles: listFilesTool,
};
