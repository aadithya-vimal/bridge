const { default_api } = require("default_api");
default_api.readFilesToContextTool({
  file_paths: ["src/convex/users.ts"],
  replace_files_in_context: false
});
