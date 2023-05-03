import { Norsk, selectAllVideos, selectAudio, selectVideo, StreamMetadata, VideoEncodeLadderRung, videoStreamKeys } from "@id3asnorsk/norsk-sdk";

export async function main(): Promise<void> {
  const norsk = await Norsk.connect({});
  let rtmpInput = { id: "rtmp", port: 5001 };
  let input = await norsk.input.rtmpServer(rtmpInput);

  let abrLadder = await norsk.processor.transform.videoEncodeLadder({ id: "ladder", rungs: ladderRungs });

  let masterOutput = await norsk.output.hlsMaster({ id: "master", playlistName: "master" });
  let audioOutput = await norsk.output.hlsAudio(segmentSettings("audio"));
  let highOutput = await norsk.output.hlsVideo(segmentSettings("high"));
  let mediumOutput = await norsk.output.hlsVideo(segmentSettings("medium"));
  let lowOutput = await norsk.output.hlsVideo(segmentSettings("low"));

  highOutput.subscribe([{ source: abrLadder, sourceSelector: ladderItem("high") }]);
  mediumOutput.subscribe([{ source: abrLadder, sourceSelector: ladderItem("medium") }]);
  lowOutput.subscribe([{ source: abrLadder, sourceSelector: ladderItem("low") }]);
  audioOutput.subscribe([{ source: input, sourceSelector: selectAudio }]);

  let allVideoAndAudio = [
    { source: abrLadder, sourceSelector: selectAllVideos(ladderRungs.length) },
    { source: input, sourceSelector: selectAudio },
  ];
  masterOutput.subscribe(allVideoAndAudio);

  console.log(`Local player: ${masterOutput.playlistUrl}`);

  let localRtcOutput = await norsk.duplex.localWebRTC({ id: "localRtcOutput" });
  localRtcOutput.subscribe(allVideoAndAudio);

  console.log(`Local player: ${localRtcOutput.playerUrl}`);

  abrLadder.subscribe([{ source: input, sourceSelector: selectVideo }]);
}

function segmentSettings(id: string) {
  return {
    id: id,
    partDurationSeconds: 1.0,
    segmentDurationSeconds: 4.0,
  };
}
const ladderRungs: VideoEncodeLadderRung[] = [
  {
    name: "high",
    width: 1280,
    height: 720,
    frameRate: { frames: 25, seconds: 1 },
    codec: {
      type: "x264",
      bitrateMode: { value: 8000000, mode: "abr" },
      keyFrameIntervalMax: 50,
      keyFrameIntervalMin: 50,
      bframes: 3,
      sceneCut: 0,
      profile: "high",
      level: 4.1,
      preset: "veryfast",
      tune: "zerolatency",
    },
  },
  {
    name: "medium",
    width: 640,
    height: 360,
    frameRate: { frames: 25, seconds: 1 },
    codec: {
      type: "x264",
      bitrateMode: { value: 250000, mode: "abr" },
      keyFrameIntervalMax: 50,
      keyFrameIntervalMin: 50,
      bframes: 0,
      sceneCut: 0,
      tune: "zerolatency",
    },
  },
  {
    name: "low",
    width: 320,
    height: 180,
    frameRate: { frames: 25, seconds: 1 },
    codec: {
      type: "x264",
      bitrateMode: { value: 150000, mode: "abr" },
      keyFrameIntervalMax: 50,
      keyFrameIntervalMin: 50,
      bframes: 0,
      sceneCut: 0,
      tune: "zerolatency",
    },
  },
];

const ladderItem =
  (desiredRendition: string) => (streams: StreamMetadata[]) => {
    const video = videoStreamKeys(streams);
    if (video.length == ladderRungs.length) {
      return video.filter((k) => k.renditionName == desiredRendition);
    }
    return [];
  };
