import { existsSync, readFileSync, writeFileSync } from "fs-extra";
import { debounce } from "lodash";

//try to read data from file
function syncFile<T>(path: string, defaultData: T) {
  let data: T;
  if (existsSync(path)) {
    try {
      const existingGameStateStr = readFileSync(path, {
        encoding: "utf8",
      });
      data = JSON.parse(existingGameStateStr);
    } catch (err) {
      console.error(err);
      data = undefined;
    }
  }
  if (!data) data = defaultData;

  const save = () => {
    writeFileSync(path, JSON.stringify(data).toString(), {
      encoding: "utf8",
    });
  };
  const enqueueSave = debounce(save, 400, { trailing: true, leading: false });

  return { data, save, enqueueSave };
}

export default syncFile;
