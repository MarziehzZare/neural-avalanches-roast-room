# Evidence protocol

These are council operating rules and proposed methodological checks, not a claim that every cited author used or endorses every check. Use the linked selected papers only for the specific findings attributed to them.

## 1. Decompose the inference

For each proposition record: claim ID; exact wording; system/preparation/state/modality; measured quantity; proposed generator; evidence type; exact URL or authorized supplied-file location; version; actual access level; relevant result; limitation; strongest live alternative; qualitative disposition; discriminating test; inference-specific kill criterion; remaining uncertainty.

Keep four levels separate:

1. **Phenomenology:** event definition, burst/avalanche observations, fitted distributions and scaling signatures.
2. **Dynamical explanation:** a specified critical regime/transition versus explicit noncritical generators.
3. **Self-organization:** a feedback/adaptation mechanism that reaches or remains near the specified regime, rather than an analyst tuning parameters. Distinguish exact/asymptotic SOC from finite-size near-critical or quasi-critical dynamics with ongoing drive; define the chosen usage. Do not silently treat the labels as interchangeable.
4. **Function and causality:** a prespecified outcome, causal contrast and mechanism-specific evidence. A model optimum, a correlation, an intervention on excitability and a selective intervention on the proposed mediator are different evidence types.

Why these separations matter in the selected literature: feedforward information transmission is simulated in the original slice-LFP work [Beggs & Plenz 2003](https://www.jneurosci.org/content/23/35/11167); spontaneous-pattern persistence is not behavioral memory [Beggs & Plenz 2004](https://www.jneurosci.org/content/24/22/5216); evoked dynamic range was actually measured under excitation/inhibition changes in slice cultures [Shew et al. 2009](https://www.jneurosci.org/content/29/49/15595). Do not collapse those into the same level of functional evidence.

## 2. Qualitative evidence status — per claim

Choose one, with reasons and scope:

- **Supported within stated scope:** relevant evidence supports this limited proposition with material alternatives addressed. Not universal certainty.
- **Consistent but non-diagnostic:** the evidence fits the claim, but credible alternatives fit too.
- **Mixed / context-dependent:** relevant results differ across preparations, methods or tested conditions; name those differences rather than average them away.
- **Not established / insufficient information:** the necessary evidence or accessible detail is absent. This is not a negative empirical result.
- **Contradicted within tested scope:** a specified prediction conflicts with relevant evidence under valid measurement assumptions. State what was tested and what remains possible.

Record source quality/access separately from the claim status. An abstract supports an abstract-level finding, not uninspected methods, numerical details or supplement conclusions. Keep author interpretation, published observation, mathematical/model result, user-supplied unverified assertion, assumption and council inference visibly separate. Use no truth percentages, popularity count or confidence average. Do not let seven agreeing lenses count as seven independent experiments.

## 3. Observation and sampling audit

Check or explicitly mark unknown:

- Modality: spike counts, negative LFP peaks, summed amplitudes, electrode counts, calcium/BOLD/other signal. State whether an event represents a cell, population or indirect measurement. Do not silently transfer timescales or event semantics.
- State/species/preparation: culture, slice, awake or anesthetized animal, human measurement; task, development and condition. Check relevance before generalizing.
- Filtering/reference/noise/artifacts; event polarity and threshold definition; normalization across channels and time; stationarity, rate changes and state mixtures.
- Temporal binning and avalanche start/stop rule; size/duration definitions, repeated events, refractory rule and silent-bin interpretation. Prespecify a defensible sensitivity grid rather than select the prettiest result.
- Spatial sampling geometry, coverage, resolution and shared measurement sources; missing units, coarse-graining, volume conduction/common input if relevant. Distinguish finite recording duration, finite network size and spatial subsampling.

The original LFP work explicitly varies binning and spatial rescaling [Beggs & Plenz 2003](https://www.jneurosci.org/content/23/35/11167). Driven/subsampled cascades can merge and split under binning in the analyzed models [Priesemann et al. 2014](https://www.frontiersin.org/journals/systems-neuroscience/articles/10.3389/fnsys.2014.00108/full). Mathematical subsampling-scaling results assume an event-retention map that need not preserve experimental bin-defined avalanches [Levina & Priesemann 2017](https://www.nature.com/articles/ncomms15140). Treat these as specific reasons to audit, not universal corrections to apply blindly.

## 4. Statistical and model-discrimination proposals

Match the analysis to the actual claim and data; do not demand every diagnostic as a ritual checklist.

- Avoid visual log-log regression as the sole test. Specify discrete/continuous distribution, normalization, fit range/cutoff estimation, uncertainty and sensitivity. Compare plausible alternatives such as truncated power laws, lognormal/exponential or mixture distributions; use suitable likelihood and goodness-of-fit procedures with resampling that respects dependence. Correct exploratory selection/multiple comparisons and separate held-out confirmation where feasible. A non-rejected fit is not proof of a generator.
- Check joint predictions when the theory justifies them: size/duration/mean-size relations, shape collapse, cutoff/finite-size behavior, correlation/time scales, response/coherence and proposed control/order parameters. Define exponent sign conventions and distinguish density from cumulative distributions. Do not substitute electrode removal for a real change in full-system size without a sampling argument.
- Carry at least one strong noncritical stochastic/driven alternative and a suitable known critical positive comparator through the same measurement pipeline. Choose nulls for the hypothesis: time shuffles may remove structure a null should preserve; independent noise is not always a strong comparator for correlated recordings. Consider rate modulation, nonstationarity, latent/common input, thresholded correlated signals, irregular network activity, finite-size and observation-induced splitting/merging as relevant.
- Separate genuine state signatures from processing artifacts and distinguish multiple candidate critical transitions. If estimating an effective branching/decay parameter, inspect model class, drive, sampling assumptions, stationarity and lag dependence before interpreting distance to criticality.

Grounding: threshold/stochastic counterexamples challenge visual-fit sufficiency [Touboul & Destexhe 2010](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0008982); power laws and universal scaling occur in the paper’s noncritical irregular regimes [Touboul & Destexhe 2017](https://journals.aps.org/pre/abstract/10.1103/PhysRevE.95.012413). Neither result means all possible criticality diagnostics fail. Multistep regression derives subsampling robustness under a stated autoregressive/observation framework, not arbitrary observation processes [Wilting & Priesemann 2018](https://www.nature.com/articles/s41467-018-04725-4). Synchronization and bistable theories provide distinct candidate mechanisms, not established explanations of every recording [di Santo et al. 2018, preprint v1](https://arxiv.org/abs/1801.10356v1), [di Santo et al. 2016, preprint v2](https://arxiv.org/html/1605.05161v2).

## 5. Tests, causal claims and kill criteria

Give every important proposed test: the narrow claim, competing generators, predicted divergent observation, authorized data needed, observation pipeline, prespecified metric, robustness controls, criterion and interpretation if it fails. Do not invent pilot effect sizes or claim a proposal has been run. Set numeric tolerances only from supplied constraints, justified theory or an explicitly hypothetical planning assumption; otherwise state what calibration/power information is needed.

For function, ask what outcome is being improved, compared with what baseline, at what timescale and cost. Separate prediction, association and causation. Ask whether the manipulation also changes rate, excitability, inhibition, noise, arousal or other direct causes; consider specificity, rescue and mediation designs where relevant, as proposals, not completed evidence. A positive result for dynamic range does not establish memory, general intelligence or clinical benefit.

Name the inference being killed. A credible null reproducing an exponent kills the exponent’s diagnostic sufficiency, not the possibility of criticality. Failure of a selective model prediction can undermine that mechanism without erasing observed bursts. Missing causal evidence kills the word “demonstrates” for functional causality, not the hypothesis’s scientific value.

## 6. Optional research-design utility scoring

Use only if the user explicitly wants to rank design options. Register options including status quo/smaller test, criteria, direction, anchored 0–5 scale and nonnegative weights **before** scoring. Separate feasibility, cost, time, ethical/access limits and expected discrimination; do not score claim truth. Default to an unscored reasoned recommendation.

For option j compute U_j = sum(w_i * s_ij) / sum(w_i), with sum(w_i) > 0. Show the inputs, products, sums and sensitivity to plausible weights; mark every score a subjective planning judgment, not a truth probability or empirically estimated effect. Use deterministic arithmetic. Do not turn unknowns into zero; report incomplete utility or a clearly justified range. Ethical/access violations are vetoes, not penalties to average away. Do not average scientist-named “truth scores,” and do not use optional utility to overrule a claim-level evidence boundary.
