import { useEffect, useState } from "react";
import { parseStringPromise } from "xml2js";
import axios from "axios";

export default function Lyric() {
  const [lyrics, setLyrics] = useState([]);

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        // axios dùng để thực hiện các yêu cầu http
        const response = await axios.get(
          `https://storage.googleapis.com/ikara-storage/ikara/lyrics.xml`
        );
        // hàm parseStringPromise để chuyển đổi chuỗi XML từ phản hồi thành đối tượng JavaScript
        const parsedData = await parseStringPromise(response.data);

        console.log("dữ liệu chuyển đổi: ", parsedData);

        // lyricsArray là một mảng chứa các đoạn lời bài hát
        // lọc qua mảng params
        const lyricsArray = parsedData.data.param.map((param, index) => {
          // tính thời gian bắt đầu của đoạn nhạc tiếp theo
          const nextStartTime =
            // kiểm tra đoạn nhạc hiện tại (index) có phải cuối cùng không
            // nếu index < chiều dài của params - 1 -> chưa phải cuối cùng
            index < parsedData.data.param.length - 1
              ? parseFloat(parsedData.data.param[index + 1].i[0].$.va) * 1000
              : // lấy thời gian bắt đầu của từ đầu tiên trong đoạn nhạc tiếp theo
                null;

          // parseFloat chuyển đổi giá trị thời gian từ chuỗi sang số thực
          // * 1000 chuyển đổi thời gian từ giây sang mili giây

          // tính thời gian kết thúc của đoạn nhạc hiện tại
          // thời gian kết thúc sẽ là thời gian bắt đầu của đoạn tiếp theo trừ đi thời gian bắt đầu của đoạn hiện tại
          const endTime =
            parseFloat(param.i[param.i.length - 1].$.va) * 1000 +
            (nextStartTime
              ? nextStartTime -
                parseFloat(param.i[param.i.length - 1].$.va) * 1000
              : 0);

          return {
            startTime: parseFloat(param.i[0].$.va) * 1000,
            endTime: endTime,
            words: param.i.map((line) => ({
              time: parseFloat(line.$.va) * 1000,
              text: line._,
            })),
          };
        });

        setLyrics(lyricsArray);
      } catch (error) {
        console.error("Error fetching or parsing lyrics:", error);
      }
    };

    fetchLyrics();
  }, []);

  return lyrics;
}
