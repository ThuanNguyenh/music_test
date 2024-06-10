/* eslint-disable no-loop-func */
import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import { Button } from "react-bootstrap";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { Seekbar } from "react-seekbar";
import Lyric from "./Lyric";
import { TbRewindBackward5, TbRewindForward5 } from "react-icons/tb";

// Helper function to format time in MM:SS
const formatTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

function App() {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const lyrics = Lyric();
  const dotCountRef = useRef(3);

  useEffect(() => {
    if (position === duration) {
      setIsPlaying(false);
    }
  }, [position, duration]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      if (isPlaying) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  // vẽ lời bài hát trên canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const lineHeight = 30; // khoảng cách dòng
    const canvasHeight = canvas.parentNode.clientHeight; // chiều cao của canvas
    const canvasWidth = canvas.parentNode.clientWidth; // chiều rộng của canvas
    canvas.height = canvasHeight; // thiết lập chiều cao của canvas

    ctx.font = "17px system-ui"; // font chữ

    const renderLyrics = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Tìm chỉ số của dòng hiện tại
      const currentIndex = lyrics.findIndex((line) => position < line.endTime);
      const startIndex = Math.max(0, currentIndex - 1); // Hiển thị trước dòng hiện tại 1 dòng
      const endIndex = Math.min(lyrics.length, currentIndex + 2); // Hiển thị sau dòng hiện tại 2 dòng

      let y = 25; // Bắt đầu từ trên cùng

      for (let i = startIndex; i < endIndex; i++) {
        const line = lyrics[i];
        let x = 0; // Vị trí ngang ban đầu cho mỗi dòng

        // Sử dụng biến local để lưu trữ số lượng dấu chấm
        let dotCount = dotCountRef.current;

        if (position < lyrics[0]?.startTime) {
          // Tính số lượng dấu chấm cần hiển thị dựa trên thời gian còn lại cho đến khi bắt đầu lyric
          const remainingTime = lyrics[0]?.startTime - position;
          const maxDots = 3; // Số lượng dấu chấm tối đa
          const dotInterval = 1000; // Thời gian giữa mỗi dấu chấm (milliseconds)
          const dotsToShow = Math.min(
            maxDots,
            Math.floor(remainingTime / dotInterval)
          );
          dotCount = dotsToShow;
        }

        if (position < lyrics[0]?.startTime) {
          // Nếu position sắp bằng thời gian bắt đầu, vẽ dấu chấm mất dần
          const dotSpacing = 15; // Khoảng cách giữa các dấu chấm
          for (let i = 0; i < dotCount; i++) {
            ctx.fillText(".", 0 + i * dotSpacing, 10); // Vẽ dấu chấm
          }
        }

        // mảng chứa các từ trong dòng hiện tại
        line.words.forEach((word, index) => {
          const wordStartTime = word.time; // thời gian bắt đầu của từ hiện tại
          const wordEndTime =
            index < line.words.length - 1
              ? line.words[index + 1].time
              : line.endTime; // thời gian kết thúc của từ hiện tại
          const wordDuration = wordEndTime - wordStartTime; // thời gian kéo dài của từ hiện tại

          // chạy tô màu chữ
          for (let charIndex = 0; charIndex < word.text.length; charIndex++) {
            const char = word.text[charIndex]; // ký tự hiện tại
            const charWidth = ctx.measureText(char).width; // chiều rộng của ký tự hiện tại
            const charTimeStart =
              wordStartTime + (charIndex / word.text.length) * wordDuration; // thời gian bắt đầu của ký tự hiện tại
            // const charTimeEnd =
            //   wordStartTime +
            //   ((charIndex + 1) / word.text.length) * wordDuration;

            if (x + charWidth > canvasWidth - 10) {
              x = 0; // Di chuyển về đầu dòng
              y += lineHeight; // Di chuyển xuống dòng mới
            }

            if (position >= charTimeStart) {
              ctx.fillStyle = "yellow"; // Tô sáng ký tự đã qua
            } else {
              ctx.fillStyle = "white"; // Màu trắng cho các ký tự chưa tới
            }

            ctx.fillText(char, x, y + parseInt(ctx.font)); // Vẽ ký tự
            x += charWidth; // Di chuyển vị trí x cho ký tự tiếp theo
          }
          // x += 5; // Khoảng cách giữa các từ
        });

        y += lineHeight; // Di chuyển vị trí y cho dòng tiếp theo
      }
    };

    renderLyrics();
  }, [position, lyrics]);

  const handleSeek = (position) => {
    setPosition(position);
    if (audioRef.current) {
      audioRef.current.currentTime = position / 1000; // chuyển đổi sang giây
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime * 1000;

      setPosition(currentTime); // chuyển sang mili giây
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration * 1000); // chuyển đổi sang mili giây
    }
  };

  const handleForward = () => {
    setPosition((prevPosition) => {
      const newPosition = Math.min(prevPosition + 5000, duration);
      if (audioRef.current) {
        audioRef.current.currentTime = newPosition / 1000;
      }
      return newPosition;
    });
  };

  const handleBackward = () => {
    setPosition((prevPosition) => {
      const newPosition = Math.max(prevPosition - 5000, 0);
      if (audioRef.current) {
        audioRef.current.currentTime = newPosition / 1000;
      }
      return newPosition;
    });
  };

  return (
    <div className="wrap">
      <div className="card">
        <img src="./music2.png" alt="1" />

        <div className="h-50 can-con">
          <canvas ref={canvasRef} />
        </div>

        <div className="time">
          <div>{formatTime(position)}</div>
          <Button onClick={handleBackward}>
            <TbRewindBackward5 className="play" />
          </Button>
          <div>
            <Button onClick={handlePlayPause}>
              {isPlaying ? (
                <CiPause1 className="play" />
              ) : (
                <CiPlay1 className="play" />
              )}
            </Button>
          </div>
          <Button onClick={handleForward}>
            <TbRewindForward5 className="play" />
          </Button>
          <div>{formatTime(duration)}</div>
        </div>

        <Seekbar
          className="seek"
          position={position}
          duration={duration}
          onSeek={handleSeek}
        />

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          src="https://storage.googleapis.com/ikara-storage/tmp/beat.mp3"
        />
      </div>
    </div>
  );
}

export default App;
