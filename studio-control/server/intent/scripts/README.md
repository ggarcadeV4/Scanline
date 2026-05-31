# Pre-staged scripts (Tier 2)

Foreseeable-rare actions live here as small, tested, **deterministic** modules. The agent
doesn't improvise these — it picks the right one and fires it.

## Shape (suggested)

Each script exports `{ name, description, params, async run(obs, args) }` so the intent layer
can register it and the agent can read its description for discoverability.

```js
module.exports = {
  name: 'chroma_key_cam',
  description: 'Apply a chroma key filter to the webcam source.',
  params: { source: 'string' },
  async run(obs, { source }) {
    // guarded if it modifies persistent config: snapshot first, then apply, then log
    await obs.call('CreateSourceFilter', {
      sourceName: source,
      filterName: 'Chroma Key',
      filterKind: 'chroma_key_filter_v2',
      filterSettings: { key_color_type: 'green' }
    });
  }
};
```

## How this folder grows (the self-growing library)

1. Unforeseen action comes up.
2. Agent **generates** a candidate script.
3. **You review and clear it** (your existing loop).
4. Vetted script is **promoted into this folder** and registered in `../intents.md`.

So the library isn't a fixed list written once — it grows every time an unforeseen case
survives review. Empty for now; this is where Tier 2 accumulates.
