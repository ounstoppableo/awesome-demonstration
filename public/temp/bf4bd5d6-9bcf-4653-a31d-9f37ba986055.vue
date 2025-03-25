<template>
  <div class="domain">
    <div class="root" ref="root" style="display: none">
      <div class="container" ref="container" id="musicContainer">
        <div class="albumAndLyric">
          <div ref="album" class="album">
            <div
              class="musicPic"
              :style="{
                backgroundImage: 'url(' + currentMusic.picUrl + ')',
              }"
            ></div>
            <div class="dot"></div>
            <canvas ref="voiceFrequency" id="voiceFrequency"></canvas>
          </div>
          <div ref="wantChangeColorEle" class="lyric">
            <div v-if="!currentLyric" class="noLyric">纯音乐，请欣赏</div>
            <div ref="scrollContainer" v-if="currentLyric">
              <div
                :key="i"
                v-for="(item, i) in currentLyric"
                :id="
                  audio.currentTime >= item[0] &&
                  (i === currentLyric.length - 1 ||
                    audio.currentTime < currentLyric[i + 1][0])
                    ? 'active'
                    : ''
                "
                :class="{
                  active:
                    audio.currentTime >= item[0] &&
                    (i === currentLyric.length - 1 ||
                      audio.currentTime < currentLyric[i + 1][0]),
                }"
                :data-index="item[0]"
                @click="lyricTransform(item[0])"
              >
                {{ item[1] }}
              </div>
            </div>
            <canvas ref="getBgLightColor"></canvas>
          </div>
        </div>
        <div class="controler">
          <span
            class="fontSize iconfont icon-mulu"
            @click="showMusicList('musicList')"
          ></span>
          <span
            class="fontSize iconfont"
            @click="toggleIyric()"
            :class="{ 'icon-geciweidianji': !isIyric, 'icon-album1': isIyric }"
          ></span>
          <span
            class="fontSize iconfont icon-shangyiqu"
            @click="prevSong()"
          ></span>
          <span
            class="fontSize iconfont icon-xiayiqu"
            @click="nextCallback()"
          ></span>
          <span
            class="fontSize iconfont"
            @click="togglePlayerModel()"
            :class="{
              'icon-danquxunhuan': playerModel === 'danqu',
              'icon-shunxubofang': playerModel === 'shunxu',
              'icon-suijibofang': playerModel === 'suiji',
            }"
          ></span>
          <span
            class="player iconfont"
            :class="{ 'icon-24gf-play': !play, 'icon-tingzhi': play }"
            @click="playAudio(play ? false : true)"
          ></span>
        </div>
        <div class="musicInfo">
          <div class="musicName" :title="currentMusic.musicName">
            {{ currentMusic.musicName }}
          </div>
          <div class="musicAuthor" :title="currentMusic.musicAuthor">
            {{ currentMusic.musicAuthor }}
          </div>
        </div>
        <div class="player">
          <div class="totalTime">
            {{ secondsToTime(currentMusic.musicTime) }}
          </div>
          <div
            class="progress"
            @mousedown="onMousedown()"
            @click="setProgress($event)"
            @mousemove="setProgress($event)"
          ></div>
          <div class="currentTime">{{ secondsToTime(currentTime) }}</div>
        </div>
      </div>
      <div class="musicList" id="musicList" ref="musicListRef">
        <div class="header">
          <div class="left">
            <span
              class="fontSize iconfont icon-mulu"
              style="font-size: 1.25rem"
            ></span>
            <span>Favorite Musics</span>
          </div>
          <div class="right">
            <span
              class="fontSize iconfont icon-homefill"
              style="
                font-size: 1.25rem;
                cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
                  pointer;
              "
              @click="showMusicList('musicPlayer')"
            ></span>
          </div>
        </div>
        <div class="listContainer">
          <div
            class="musicItem"
            :key="i"
            :class="{ actived: item.musicUrl === currentMusic.musicUrl }"
            v-for="(item, i) of musicList"
            @click="handleClickMusic(i)"
          >
            <div class="musicPic">
              <img :src="item.picUrl" alt="" noLazyLoad="true" />
            </div>
            <div class="musicInfo">
              <div class="musicName" :title="item.musicName">
                {{ item.musicName }}
              </div>
              <div class="musicAuthor" :title="item.musicAuthor">
                {{ item.musicAuthor }}
              </div>
            </div>
            <div style="flex: 1"></div>
            <div class="musicTime">{{ secondsToTime(item.musicTime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mask" ref="mask" :style="{ display: 'none' }"></div>

    <div
      class="playerOpener toShow"
      id="musicOpener"
      ref="playerOpener"
      v-if="musicList.length !== 0"
      @click="open()"
    >
      <span class="iconfont icon-wangyiyunyinle"></span>
      <div class="noteAnimation" v-if="play">
        <span
          class="iconfont icon-yinle"
          v-if="iconCount === 1"
          :style="{ color: '#e57373' }"
        ></span>
        <span
          class="iconfont icon-yinle1"
          v-if="iconCount === 2"
          :style="{ color: '#9575cd' }"
        ></span>
        <span
          class="iconfont icon-yinfu"
          v-if="iconCount === 3"
          :style="{ color: '#81c784' }"
        ></span>
        <span
          class="iconfont icon-yinfu1"
          v-if="iconCount === 4"
          :style="{ color: '#64b5f6', fontSize: '1.25rem' }"
        ></span>
        <span
          class="iconfont icon-yinfu2"
          v-if="iconCount === 5"
          :style="{ color: '#ffb74d', fontSize: '1.25rem' }"
        ></span>
        <span
          class="iconfont icon-yinfu02"
          v-if="iconCount === 6"
          :style="{ color: '#4db6ac', fontSize: '1.25rem' }"
        ></span>
      </div>
    </div>

    <audio
      ref="audio"
      :src="
        currentMusic.musicUrl &&
        'https://www.unstoppable840.cn/api/music/' + currentMusic.musicUrl
      "
      :style="{ width: '0rem', height: '0rem' }"
    ></audio>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  getAverageColor,
  getDarkColor,
  getGrayishColor,
} from "colorComputed";
import { musicList as musicListRaw } from "musicList";
import { secondsToTime, timecodeToSeconds } from "timeTransformer";
const play = ref(false);
const isIyric = ref(false);
const isPress = ref(false);
const iconCount = ref(1);
const musicList = ref<any[]>(musicListRaw);
const currentMusic = ref(musicListRaw[0]);
const currentLyric: any = ref(musicListRaw[0].lyric);
const currentLyricIndex = ref(0);
const currentTime = ref(0);

const audioInit = ref(false);
const dataArray = ref<any>([]);

const playerModel = ref<"danqu" | "shunxu" | "suiji">("shunxu");

const index = ref(0);
const total = ref(musicListRaw.length);

const timer1 = ref<any>(null);
const timer2 = ref<any>(null);
const musicIconTimer = ref<any>(null);

const ctx = ref<any>(null);
const root = ref<any>(null);
const mask = ref<any>(null);
const album = ref<any>(null);
const audio = ref<any>({});
const analyser = ref<any>(null);
const container = ref<any>(null);
const playerOpener = ref<any>(null);
const musicListRef = ref<any>(null);
const voiceFrequency = ref<any>(null);
const getBgLightColor = ref<any>(null);
const scrollContainer = ref<any>(null);
const wantChangeColorEle = ref<any>(null);

const closeForClickOtherPlace = (e: any) => {
  if (
    !e.target.closest("#musicContainer") &&
    !e.target.closest("#musicOpener") &&
    !e.target.closest("#musicList")
  ) {
    close();
  }
};

//歌词分割
const lyricSegment = () => {
  currentLyric.value = currentMusic.value.lyric
    ? currentMusic.value.lyric.split("[").map((item: any) => {
        const temp = item.split("]");
        if (temp[0] && temp[1]) return [timecodeToSeconds(temp[0]), temp[1]];
        else return [""];
      })
    : "";
};
//歌词点击跳转
const lyricTransform = (time: any) => {
  if (time) {
    audio.value.currentTime = time;
  }
};

//获取图片浅色作为背景颜色
const getMixLightColor = (canvas: any, wantChangeColorEle: any) => {
  if (!canvas && !wantChangeColorEle && !currentMusic.value) return;
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "Anonymous"; // 跨域图片需要设置
  img.onload = () => {
    // 将图片加载到 canvas 中
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 获取图片的主色调
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const averageColor = getAverageColor(pixelData);

    // 将背景颜色设置为主色调的浅色版本
    const darkColor = getDarkColor(averageColor);
    wantChangeColorEle.style.backgroundColor = darkColor;
    scrollContainer.value
      ? (scrollContainer.value.style.color = getGrayishColor(darkColor))
      : "";
  };
  // 图片来源
  img.src = currentMusic.value.picUrl;
};

//画频率
const draw = () => {
  //每次画完都准备下一次的绘制
  requestAnimationFrame(draw);
  //如果音频没有初始化或没播放，则不画
  if (!audioInit.value) return;
  const { width, height } = voiceFrequency.value;
  //初始化画布
  ctx.value.clearRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 125;
  //存入数据
  analyser.value.getByteFrequencyData(dataArray.value);
  const count = 40;
  const barWidth = (2 * Math.PI * radius) / count / 2 - 1;
  let angle1 = 0;
  let angle2 = Math.PI;
  const angleI = (2 * Math.PI) / count / 2;
  let i = 90;
  while (i++ < count + 90) {
    const j = (((i - 1) * 17) % 70) + 90;
    const data = dataArray.value[j];
    const barHeight = (data / 255) * 50;
    const x0 = centerX + radius * Math.cos(angle1);
    const y0 = centerY + radius * Math.sin(angle1);
    const x1 = centerX + (radius + barHeight) * Math.cos(angle1);
    const y1 = centerY + (radius + barHeight) * Math.sin(angle1);
    const x2 = centerX + radius * Math.cos(angle2);
    const y2 = centerY + radius * Math.sin(angle2);
    const x3 = centerX + (radius + barHeight) * Math.cos(angle2);
    const y3 = centerY + (radius + barHeight) * Math.sin(angle2);
    // 绘制直线
    ctx.value.beginPath();
    ctx.value.moveTo(x0, y0);
    ctx.value.lineTo(x1, y1);
    ctx.value.moveTo(x2, y2);
    ctx.value.lineTo(x3, y3);
    ctx.value.strokeStyle = "#9ca3af";
    ctx.value.lineWidth = barWidth;
    ctx.value.stroke();
    ctx.value.closePath();
    angle1 += angleI;
    angle2 += angleI;
  }
};
//audio播放事件
const audioPlayCallback = () => {
  if (audioInit.value) {
    return;
  }
  //获取音频上下文
  const atx = new AudioContext();
  //获取音频源节点
  const source = atx.createMediaElementSource(audio.value);
  //获取分析器
  analyser.value = atx.createAnalyser();
  analyser.value.fftSize = 512;
  //创建存储数组
  dataArray.value = new Uint8Array(analyser.value.frequencyBinCount);
  //连接源节点和分析器，有助于将数据传入分析器
  source.connect(analyser.value);
  //连接分析器和扬声器，能够发出声音
  analyser.value.connect(atx.destination);
  audioInit.value = true;
};
//audio播放中事件
const audioTimeupdateCallback = () => {
  currentTime.value = audio.value.currentTime;
  const lengthPencentage =
    (audio.value.currentTime / audio.value.duration) * 100;
  (document.querySelector(".domain")! as any).style.setProperty(
    "--progressWidth",
    lengthPencentage + "%"
  );
  //歌词滚动定位
  if (currentLyric.value) {
    const active = scrollContainer.value.querySelector("#active");
    if (!active) return;
    if (active.dataset.index !== currentLyricIndex.value) {
      currentLyricIndex.value = active.dataset.index;
      requestAnimationFrame(() => {
        active.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }
};
//audio结束事件
const audioEndedCallback = () => {
  playerModelControler();
};
//audio停止事件
const audioPauseCallback = () => {};

//切换播放模式
function togglePlayerModel() {
  playerModel.value =
    playerModel.value === "shunxu"
      ? "suiji"
      : playerModel.value === "suiji"
      ? "danqu"
      : "shunxu";
  if (playerModel.value === "shunxu") {
    playerModelControler = () => {
      nextSong();
    };
  } else if (playerModel.value === "suiji") {
    playerModelControler = () => {
      randomSong();
    };
  } else {
    playerModelControler = () => {
      audio.value.currentTime = 0;
      requestAnimationFrame(() => {
        if (play) audio.value.play();
      });
    };
  }
}
let playerModelControler = () => {
  nextSong();
};
function playAudio(flag: boolean) {
  play.value = flag;
  if (flag) {
    musicIconTimer.value =
      !musicIconTimer.value &&
      setInterval(() => {
        musicIconControl();
      }, 2000);
    container.value.querySelector(".musicPic").classList.add("playingOnPic");
    audio.value.play();
  } else {
    clearInterval(musicIconTimer.value);
    musicIconTimer.value = null;
    container.value.querySelector(".musicPic").classList.remove("playingOnPic");
    audio.value.pause();
  }
}
function nextSong() {
  if (index.value === total.value - 1) index.value = 0;
  else index.value++;
  selectMusic();
  requestAnimationFrame(() => {
    if (play.value) audio.value.play();
  });
}
function prevSong() {
  if (index.value === 0) index.value = total.value - 1;
  else index.value--;
  selectMusic();
  requestAnimationFrame(() => {
    if (play.value) audio.value.play();
  });
}
function randomSong() {
  let i = Math.floor(Math.random() * musicList.value.length);
  while (i === index.value) {
    i = Math.floor(Math.random() * musicList.value.length);
  }
  index.value = i;
  selectMusic();
  requestAnimationFrame(() => {
    if (play.value) audio.value.play();
  });
}
const handleClickMusic = (i: number) => {
  index.value = i;
  selectMusic();
  requestAnimationFrame(() => {
    playAudio(true);
  });
};
function toggleIyric() {
  isIyric.value = !isIyric.value;
  if (isIyric.value) {
    wantChangeColorEle.value.style.transform = "rotateY(360deg)";
    album.value.style.transform = "rotateY(180deg)";
    wantChangeColorEle.value.style.borderRadius = "10%";
    album.value.style.zIndex = "0";
    wantChangeColorEle.value.style.zIndex = "1";
    album.value.style.opacity = "0";
    wantChangeColorEle.value.style.opacity = "1";
  } else {
    wantChangeColorEle.value.style.transform = "rotateY(180deg)";
    album.value.style.transform = "rotateY(0deg)";
    wantChangeColorEle.value.style.borderRadius = "100%";
    album.value.style.zIndex = "1";
    wantChangeColorEle.value.style.zIndex = "0";
    album.value.style.opacity = "1";
    wantChangeColorEle.value.style.opacity = "0";
  }
}
function selectMusic() {
  currentMusic.value = musicList.value[index.value];
  currentTime.value = 0;
  lyricSegment();
  getMixLightColor(getBgLightColor.value, wantChangeColorEle.value);
}
//下一首歌的回调
const nextCallback = () => {
  if (playerModel.value === "suiji") {
    randomSong();
  } else {
    nextSong();
  }
};

//进度条调整
function onMousedown() {
  isPress.value = true;
}
function setProgress(e: any) {
  if (e.type === "mousemove") {
    if (isPress.value) {
      const rect = e.target.getBoundingClientRect();
      const lengthPencentage = ((e.x - rect.x) / rect.width) * 100;
      (document.querySelector(".domain")! as any).style.setProperty(
        "--progressWidth",
        lengthPencentage + "%"
      );
      audio.value.currentTime = (audio.value.duration * lengthPencentage) / 100;
    }
  } else {
    const rect = e.target.getBoundingClientRect();
    const lengthPencentage = ((e.x - rect.x) / rect.width) * 100;
    (document.querySelector(".domain")! as any).style.setProperty(
      "--progressWidth",
      lengthPencentage + "%"
    );
    audio.value.currentTime = (audio.value.duration * lengthPencentage) / 100;
  }
}
const closePress = () => {
  isPress.value = false;
};

function close() {
  if (!timer1.value) {
    if (!root.value) return;
    root.value.classList.add("closePlayer");
    timer1.value = setTimeout(() => {
      playerOpener.value.classList.remove("toLeave");
      playerOpener.value.classList.add("toShow");
      root.value.classList.remove("closePlayer");
      root.value.style.display = "none";
      mask.value.style.display = "none";
      clearTimeout(timer1.value);
      timer1.value = null;
    }, 1000);
  }
}
function open() {
  if (!timer2.value) {
    root.value.style.display = "";
    mask.value.style.display = "";
    root.value.classList.add("openPlayer");
    playerOpener.value.classList.remove("toShow");
    playerOpener.value.classList.add("toLeave");
    timer2.value = setTimeout(() => {
      root.value.classList.remove("openPlayer");
      clearTimeout(timer2.value);
      timer2.value = null;
    }, 1000);
  }
}

function musicIconControl() {
  iconCount.value = [1, 2, 3, 4, 5, 6].filter(
    (item) => item !== iconCount.value
  )[Math.floor(Math.random() * 5)];
}

function showMusicList(type: "musicPlayer" | "musicList") {
  if (type === "musicPlayer") {
    container.value.style.opacity = "1";
    container.value.style.zIndex = "1";
    musicListRef.value.style.opacity = "0";
    musicListRef.value.style.zIndex = "0";
    container.value.style.transition = " all linear 0.3s 0.15s";
    musicListRef.value.style.transition = " all linear 0.3s 0s";
  } else {
    container.value.style.opacity = "0";
    container.value.style.zIndex = "0";
    musicListRef.value.style.opacity = "1";
    musicListRef.value.style.zIndex = "1";
    container.value.style.transition = " all linear 0.3s 0s";
    musicListRef.value.style.transition = " all linear 0.3s 0.15s";
  }
}

const loadIconfont = () => {
  document.getElementById("iconfontCss")?.remove();
  document.getElementById("iconfontJs")?.remove();
  const link = document.createElement("link");
  link.href =
    "https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/font/iconfont.css";
  link.rel = "stylesheet";
  link.id = "iconfontCss";
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/font/iconfont.js";
  script.id = "iconfontJs";
  document.head.append(script);
  document.head.append(link);
};
loadIconfont();

onMounted(() => {
  if (innerWidth < 500) root.value.style.transform = "scale(0.7)";

  lyricSegment();
  getMixLightColor(getBgLightColor.value, wantChangeColorEle.value);

  window.addEventListener("mouseup", closePress);
  audio.value.addEventListener("timeupdate", audioTimeupdateCallback);
  audio.value.addEventListener("ended", audioEndedCallback);

  //初始化canvas
  voiceFrequency.value.width = 350;
  voiceFrequency.value.height = 350;
  ctx.value = voiceFrequency.value.getContext("2d");
  //初始化音频上下文
  audio.value.addEventListener("play", audioPlayCallback);
  audio.value.addEventListener("pause", audioPauseCallback);
  draw();
  window.addEventListener("click", closeForClickOtherPlace);
  open();
});
onUnmounted(() => {
  //Called once, before the instance is destroyed.
  //Add 'implements OnDestroy' to the class.
  window.removeEventListener("mouseup", closePress);
  audio.value?.removeEventListener("timeupdate", audioTimeupdateCallback);
  audio.value?.removeEventListener("ended", audioEndedCallback);
  window.removeEventListener("click", closeForClickOtherPlace);
  audio.value?.removeEventListener("play", audioPlayCallback);
  audio.value?.removeEventListener("pause", audioPauseCallback);
});
</script>
<style scoped lang="scss">
.domain {
  --cardColor: #fff;
  --musicWord: #acb8cc;
  --musicBtnHover: #532ab9;
  --musicName: #71829e;
  --musicAuthor: #96a3b9;
  --musicTotalTime: #b0baca;
  --musicProgressBg: #d0d8e6;
  --musicIcon: #ea3e3c;
  --progressColor: #9ca3af;
  --musicPlayerBgColor: rgba(238, 243, 247, 0.7);
  --progressWidth: 0;
  * {
    box-sizing: border-box;
  }
}
.root {
  position: fixed;
  width: 17.5rem;
  height: 28.125rem;
  background-color: var(--musicPlayerBgColor);
  backdrop-filter: blur(0.625rem);
  border-radius: 1.25rem;
  inset: 0;
  margin: auto;
  box-shadow: 0rem 0.9375rem 2.1875rem -0.3125rem rgba(50, 88, 130, 0.32);
  z-index: 9999;
  transition: all linear 1s;
  .container {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 100%;
    & > .albumAndLyric {
      position: absolute;
      perspective: 31.25rem;
      width: 100%;
      height: 100%;

      & > .lyric {
        position: absolute;
        transition: all 1s linear;
        transform: rotateY(180deg);
        width: 15.625rem;
        height: 15.625rem;
        top: 1.875rem;
        left: -5rem;
        z-index: 0;
        border-radius: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;

        & > .noLyric {
          position: absolute;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.125rem;
          color: var(--white);
        }

        & > div {
          position: absolute;
          height: 100%;
          padding: 1.875rem;
          z-index: 9999;

          &::-webkit-scrollbar {
            width: 0;
            /* 隐藏滚动条宽度 */
          }
          scrollbar-width: none;

          height: 100%;
          width: 100%;
          text-align: center;
          overflow-y: scroll;

          & > div {
            font-size: 0.875rem;
            line-height: 1rem;
            padding: 0.625rem 0;
            transition: all 0.5s ease;
            transform-origin: center;
            cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
              pointer;

            &.active {
              color: var(--white);
              transform: scale(1.2);
            }
          }
        }

        //反转时隐藏背面
        backface-visibility: hidden;
        transform-style: preserve-3d;

        & > canvas {
          position: absolute;
          display: none;
          inset: 0;
          margin: auto;
        }

        &::before {
          content: "";
          background: inherit;
          width: 100%;
          height: 100%;
          position: absolute;
          transition: all 1s linear;
          box-shadow: 0rem 0.625rem 2.5rem 0rem rgba(76, 70, 124, 0.5);
          top: 1.25rem;
          transform: scale(0.9);
          filter: blur(0.625rem);
          z-index: -1;
          opacity: 0.9;
          border-radius: inherit;
        }

        &::after {
          content: "";
          background: inherit;
          width: 100%;
          height: 100%;
          box-shadow: 0rem 0.625rem 2.5rem 0rem rgba(76, 70, 124, 0.5);
          z-index: 2;
          position: absolute;
          border-radius: inherit;
        }
      }

      & > .album {
        position: absolute;
        transition: all 1s linear;
        width: 15.625rem;
        height: 15.625rem;
        top: 1.875rem;
        left: -5rem;
        border-radius: 624.9375rem;
        z-index: 1;

        //反转时隐藏背面
        backface-visibility: hidden;
        transform-style: preserve-3d;

        & > .dot {
          position: absolute;
          width: 1.875rem;
          height: 1.875rem;
          background-color: var(--musicPlayerBgColor);
          border: 0.3125rem solid var(--white);
          border-radius: 624.9375rem;
          inset: 0;
          margin: auto;
          z-index: 100;
        }

        & > #voiceFrequency {
          position: absolute;
          z-index: 9999;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 624.9375rem;
        }

        & > .musicPic {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 624.9375rem;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;

          &::before {
            content: "";
            background: inherit;
            width: 100%;
            height: 100%;
            z-index: -10;
            position: absolute;
            transition: all 0.3s ease;
            box-shadow: 0rem 0.625rem 2.5rem 0rem rgba(76, 70, 124, 0.5);
            top: 1.25rem;
            transform: scale(0.9);
            filter: blur(0.625rem);
            opacity: 0.9;
            border-radius: 624.9375rem;
          }

          &::after {
            content: "";
            background: inherit;
            width: 100%;
            height: 100%;
            box-shadow: 0rem 0.625rem 2.5rem 0rem rgba(76, 70, 124, 0.5);
            display: block;
            z-index: 2;
            position: absolute;
            border-radius: 624.9375rem;
          }
        }
      }
    }

    & > .controler {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 1.375rem;
      align-items: center;
      right: 1.25rem;
      top: 2.5rem;
      width: fit-content;
      color: var(--musicWord);
      z-index: 9999;

      & > .fontSize {
        position: relative;
        font-size: 1.625rem;
        font-weight: 1000;
        line-height: 1.375rem;
        z-index: 10;
        cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
          pointer;

        &::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: scale(0) translate(-50%, -50%);
          transform-origin: top left;
          z-index: -1;
          transition: all 0.3s ease;
          border-radius: 624.9375rem;
          width: 3.125rem;
          height: 3.125rem;
          box-shadow: 0rem 0.3125rem 0.625rem 0rem rgba(76, 70, 124, 0.2);
          background-color: var(--cardColor);
        }

        &:hover {
          color: var(--musicBtnHover);

          &::after {
            transform: scale(1) translate(-50%, -50%);
          }
        }
      }

      & > .player {
        border-radius: 624.9375rem;
        border: 0.5rem solid var(--cardColor);
        padding: 0.75rem;
        font-size: 1.875rem;
        line-height: 1.875rem;
        color: var(--cardColor);
        cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
          pointer;
        filter: drop-shadow(0 0.6875rem 0.375rem rgba(172, 184, 204, 0.45));
      }
    }

    & > .musicInfo {
      position: absolute;
      bottom: 4.6875rem;
      width: 100%;
      padding-left: 1.25rem;
      padding-right: 1.25rem;
      font-size: 1.25rem;

      & > .musicName {
        color: var(--musicName);
        font-weight: 600;
        max-width: 8.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: text;
      }

      & > .musicAuthor {
        color: var(--musicAuthor);
        font-weight: 300;
        max-width: 10rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: text;
      }
    }

    & > .player {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 0.3125rem;
      bottom: 1.25rem;
      width: 100%;
      padding-left: 1.25rem;
      padding-right: 1.25rem;

      & > .totalTime {
        align-self: flex-end;
        user-select: none;
        color: var(--musicTotalTime);
        font-weight: 700;
        font-size: 1.25rem;
      }

      & > .progress {
        position: relative;
        width: 100%;
        height: 0.375rem;
        background-color: var(--musicProgressBg);
        user-select: none;
        border-radius: 0.375rem;
        cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
          pointer;

        &::before {
          content: "";
          position: absolute;
          width: var(--progressWidth);
          height: inherit;
          background-color: var(--progressColor);
          border-radius: 0.375rem;
        }
      }

      & > .currentTime {
        user-select: none;
        color: var(--musicName);
        font-weight: 700;
        font-size: 1rem;
      }
    }
  }
  .musicList {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
    display: flex;
    flex-direction: column;
    padding-bottom: 1.25rem;
    opacity: 0;
    overflow: hidden;

    & .header {
      height: 3.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      font-size: 1.25rem;
      line-height: 1.25rem;
      font-weight: 600;
      color: var(--musicName);
      & .left {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }
    }
    & .listContainer {
      overflow-y: auto;
      overflow-x: hidden;
      &::-webkit-scrollbar {
        width: 0;
        /* 隐藏滚动条宽度 */
      }
      & .musicItem {
        height: 5rem;
        padding: 0.625rem 1.25rem;
        width: 100%;
        display: flex;
        gap: 0.625rem;
        align-items: center;
        box-shadow: 0rem 0.0625rem 0rem 0 var(--01-gray);
        transition: all 1s ease;
        cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
          pointer;

        &.actived {
          background-color: var(--015-gray) !important;
        }
        &:hover {
          background-color: var(--01-gray);
        }
        & .musicPic {
          height: 3.75rem;
          width: 3.75rem;
          overflow: hidden;
          border-radius: 1.25rem;
          & > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
        & .musicInfo {
          & > .musicName {
            color: var(--musicName);
            font-weight: 600;
            max-width: 6.875rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: text;
          }

          & > .musicAuthor {
            color: var(--musicAuthor);
            font-weight: 300;
            max-width: 6.875rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: text;
          }
        }
        & > .musicTime {
          justify-self: flex-end;
          user-select: none;
          color: var(--musicName);
          font-weight: 700;
          font-size: 1rem;
        }
        &:last-child {
          box-shadow: none;
        }
      }
    }
  }
}

.mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: transparent;
}

.playingOnPic {
  &::after {
    animation: rotates 4s linear infinite;
  }

  &::before {
    animation: rotates2 4s linear infinite;
  }
}

@keyframes rotates {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes rotates2 {
  from {
    transform: rotate(0) scale(0.9);
  }

  to {
    transform: rotate(360deg) scale(0.9);
  }
}

.closePlayer {
  animation: close 1s cubic-bezier(0, 0, 0.14, 1.25) forwards;
}

.openPlayer {
  animation: close 1s cubic-bezier(0, 0, 0.14, 1.25) forwards reverse;
}

@media only screen and (min-width: 20rem) and (max-width: 31.25rem) {
  @keyframes close {
    from {
      transform: translate(0, 0) scale(0.7);
    }

    to {
      transform: translate(-12.5rem, 5rem) scale(0);
    }
  }
}
@media only screen and (min-width: 31.25rem) and (max-width: 64rem) {
  @keyframes close {
    from {
      transform: translate(0, 0) scale(1);
    }

    to {
      transform: translate(-37.5rem, 5rem) scale(0);
    }
  }
}
@media only screen and (min-width: 64rem) and (max-width: 100rem) {
  @keyframes close {
    from {
      transform: translate(0, 0) scale(1);
    }

    to {
      transform: translate(-50rem, 5rem) scale(0);
    }
  }
}

@media only screen and (min-width: 100rem) {
  @keyframes close {
    from {
      transform: translate(0, 0) scale(1);
    }

    to {
      transform: translate(-75rem, 5rem) scale(0);
    }
  }
}

.playerOpener {
  position: fixed;
  top: 60%;
  left: 0;
  transition: all 1.5s ease;
  transform: translateX(-100%);
  z-index: 9999;
  cursor: url(https://cdn.jsdelivr.net/gh/ounstoppableo/cdn@vlatest/assets/cola.ico),
    pointer;

  &:hover {
    transform: translate(0);
  }

  & > span {
    font-size: 1.875rem;
    color: var(--musicIcon);

    &::after {
      content: "";
      position: absolute;
      width: 1.5625rem;
      height: 1.5625rem;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--white);
      z-index: -1;
      border-radius: 624.9375rem;
    }
  }
  & > .noteAnimation {
    position: absolute;
    top: -0.3125rem;
    right: 0.9375rem;
    z-index: -10;

    & > span {
      position: absolute;
      opacity: 0;
      animation: noteFloat 2s linear infinite;
    }
  }
}

.toShow {
  transform: translateX(-50%);
}

.toLeave {
  transition: all 0.3s ease;

  & > .noteAnimation {
    display: none;
  }

  &:hover {
    transform: translateX(-100%);
  }
}

@keyframes noteFloat {
  0% {
    opacity: 0;
    transform: translate(0.3125rem, 0rem) rotate(-10deg);
  }

  10% {
    opacity: 1;
    transform: translate(0.625rem, -0.3125rem) rotate(-20deg);
  }

  20% {
    opacity: 0.9;
    transform: translate(0.9375rem, -0.75rem) rotate(-10deg);
  }

  30% {
    opacity: 0.8;
    transform: translate(1.25rem, -1.1875rem) rotate(0deg);
  }

  40% {
    opacity: 0.7;
    transform: translate(1.5625rem, -1.625rem) rotate(10deg);
  }

  50% {
    opacity: 0.6;
    transform: translate(1.875rem, -2.0625rem) rotate(20deg);
  }

  60% {
    opacity: 0.4;
    transform: translate(1.8125rem, -2.5rem) rotate(10deg);
  }

  70% {
    opacity: 0.2;
    transform: translate(1.75rem, -2.9375rem) rotate(0deg);
  }

  80% {
    opacity: 0;
    transform: translate(1.6875rem, -3.375rem) rotate(-10deg);
  }

  100% {
    opacity: 0;
  }
}
</style>
<style >
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>