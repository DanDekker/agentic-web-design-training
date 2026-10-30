// Chunks may carry decoderConfig metadata when a stream changes resolution or codec.
export class DecoderConfigRouter {
  constructor(decoder) {
    // TODO: deduplicate configs and drain old output before applying a changed config.
  }
}
