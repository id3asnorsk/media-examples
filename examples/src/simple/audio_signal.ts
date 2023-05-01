import { AudioSignalGeneratorSettings, HlsAudioOutputSettings, mkSine, Norsk, selectAudio } from "@id3asnorsk/norsk-sdk"

export async function main() {
  const norsk = await Norsk.connect({});

  let input = await norsk.input.audioSignal(audioSignalSettings);
  let audioOutput = await norsk.output.hlsAudio(hlsAudioSettings);

  audioOutput.subscribe([{ source: input, sourceSelector: selectAudio }]);

  audioOutput.url().then(playlistUrl => {
    console.log(`playlistUrl: ${playlistUrl}`);
  });
}

const audioSignalSettings: AudioSignalGeneratorSettings = {
  id: "audio-signal",
  sourceName: "signal",
  channelLayout: "stereo",
  sampleRate: 48000,
  wave: mkSine(440),
};

const hlsAudioSettings: HlsAudioOutputSettings = {
  id: "hls-audio",
  partDurationSeconds: 1.0,
  segmentDurationSeconds: 4.0,
};
