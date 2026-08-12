type AudioGraph = {
  context: AudioContext;
  analyser: AnalyserNode;
};

const audioGraphs = new WeakMap<HTMLAudioElement, AudioGraph>();

export function getAudioContext(audio: HTMLAudioElement): AudioContext {
  return getAudioGraph(audio).context;
}

export function getAudioAnalyser(audio: HTMLAudioElement): AnalyserNode {
  return getAudioGraph(audio).analyser;
}

function getAudioGraph(audio: HTMLAudioElement): AudioGraph {
  let graph = audioGraphs.get(audio);

  if (!graph) {
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(context.destination);
    graph = { context, analyser };
    audioGraphs.set(audio, graph);
  }

  return graph;
}

export async function resumeAudioContext(audio: HTMLAudioElement) {
  const graph = audioGraphs.get(audio);
  if (graph?.context.state === "suspended") {
    await graph.context.resume();
  }
}
