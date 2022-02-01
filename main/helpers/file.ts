import { existsSync, readFileSync, writeFileSync } from "fs-extra";
import { debounce } from "lodash";
import { AES, enc } from "crypto-js";

const key = "fehjbf28u0n2f08ueb20fb2";

//try to read data from file
function syncFile<T>(path: string, defaultData: T) {
  let data: T;
  if (existsSync(path)) {
    try {
      const existingGameStateStr = readFileSync(path, {
        encoding: "utf8",
      });
      data = JSON.parse(
        AES.decrypt(existingGameStateStr, key).toString(enc.Utf8)
      );
    } catch (err) {
      console.error(err);
      data = undefined;
    }
  }
  if (!data) data = defaultData;

  const save = () => {
    writeFileSync(path, AES.encrypt(JSON.stringify(data), key).toString(), {
      encoding: "utf8",
    });
  };
  const enqueueSave = debounce(save, 400, { trailing: true, leading: false });

  return { data, save, enqueueSave };
}

export default syncFile;
