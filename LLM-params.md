# LLM Parameters

LLM parameters control **how the model generates responses**. They affect randomness, output length, sampling, penalties, and stopping conditions.

---

# Common LLM Parameters

| Parameter           | Description                                              | Typical Range  | Default         |
| ------------------- | -------------------------------------------------------- | -------------- | --------------- |
| `temperature`       | Controls randomness                                      | 0.0 – 2.0      | 1.0             |
| `top_p`             | Nucleus sampling                                         | 0.0 – 1.0      | 1.0             |
| `max_tokens`        | Maximum output tokens                                    | Model limit    | Varies          |
| `stop`              | Stops generation at specific strings                     | String / Array | None            |
| `seed`              | Makes output reproducible                                | Integer        | Random          |
| `presence_penalty`  | Encourages new topics                                    | -2.0 – 2.0     | 0               |
| `frequency_penalty` | Reduces repeated words                                   | -2.0 – 2.0     | 0               |
| `top_k`             | Samples from top K tokens (not supported by every model) | 1 – 100+       | Model dependent |
| `n`                 | Number of completions to generate                        | 1+             | 1               |
| `stream`            | Stream tokens as they're generated                       | true / false   | false           |
| `response_format`   | Control output format                                    | text / JSON    | text            |

---

# 1. Temperature

Controls creativity and randomness.

```text
Low Temperature (0.0)

Input:
Write a greeting

↓

Hello! How can I help you today?
```

```text
High Temperature (1.5)

Input:
Write a greeting

↓

Greetings, explorer! Ready for today's adventure?
```

| Value | Behavior      |
| ----- | ------------- |
| 0.0   | Deterministic |
| 0.2   | Very focused  |
| 0.7   | Balanced      |
| 1.0   | Creative      |
| 1.5+  | Highly random |

Best for:

* Code → 0.0–0.2
* Q&A → 0.2–0.5
* Chat → 0.7
* Story writing → 1.0+

---

# 2. Top P

Limits sampling to the smallest set of tokens whose cumulative probability reaches `p`.

```text
top_p = 0.9

Only sample from the most probable 90% of tokens.
```

| Value | Behavior       |
| ----- | -------------- |
| 0.2   | Very focused   |
| 0.5   | Conservative   |
| 0.9   | Balanced       |
| 1.0   | No restriction |

> Usually adjust **temperature OR top_p**, not both aggressively.

---

# 3. Max Tokens

Limits the response length.

```text
max_tokens = 100

↓

The model stops after approximately 100 output tokens.
```

Use cases:

* Short answers
* Prevent excessive cost
* Limit response size

---

# 4. Stop Sequences

Stop generation when a specific token or string appears.

```text
stop = ["###"]
```

Example:

```text
Question
Answer
###
Extra text...

↓

Generation stops at ###
```

---

# 5. Presence Penalty

Encourages introducing **new ideas or topics**.

| Value | Effect                                    |
| ----- | ----------------------------------------- |
| 0     | Normal                                    |
| 1     | More diverse                              |
| 2     | Strongly avoids repeating the same topics |

Example:

```text
Write ideas for startups.

↓

Produces more varied ideas instead of staying in one domain.
```

---

# 6. Frequency Penalty

Discourages repeating the same words or phrases.

| Value | Effect                      |
| ----- | --------------------------- |
| 0     | Normal                      |
| 1     | Less repetition             |
| 2     | Strong repetition reduction |

Example:

Without penalty:

```text
AI is great. AI helps people. AI improves productivity.
```

With penalty:

```text
Artificial intelligence helps people and improves productivity.
```

---

# 7. Top K

Choose only from the top **K** most likely next tokens.

```text
top_k = 40

↓

Sample only from the 40 most probable next tokens.
```

Common values:

* 20
* 40
* 50
* 100

Not all providers support `top_k`.

---

# 8. Seed

Makes outputs reproducible.

```text
seed = 42
```

Same prompt + same model + same parameters + same seed

↓

Nearly identical output.

Useful for:

* Testing
* Benchmarks
* Debugging

---

# 9. Number of Responses (n)

Generate multiple responses in one request.

```text
n = 3
```

Output:

```text
Response 1

Response 2

Response 3
```

Useful for:

* Brainstorming
* Ranking responses
* A/B testing

---

# 10. Streaming

Receive tokens as they are generated.

Without streaming:

```text
Wait...

↓

Entire answer arrives.
```

With streaming:

```text
H
He
Hell
Hello
Hello!
```

Useful for:

* Chatbots
* Real-time UX
* Lower perceived latency

---

# 11. Response Format

Force structured output.

Example:

```json
{
  "response_format": {
    "type": "json_object"
  }
}
```

Useful for:

* APIs
* Automation
* Structured extraction

---

# Parameter Comparison

| Parameter           | Controls              | Typical Value |
| ------------------- | --------------------- | ------------- |
| `temperature`       | Randomness            | 0.2–0.8       |
| `top_p`             | Probability sampling  | 0.9–1.0       |
| `top_k`             | Top token candidates  | 40            |
| `max_tokens`        | Response length       | 100–2000      |
| `stop`              | End generation        | Custom        |
| `presence_penalty`  | Topic diversity       | 0–1           |
| `frequency_penalty` | Word repetition       | 0–1           |
| `seed`              | Reproducibility       | 42            |
| `n`                 | Number of completions | 1             |
| `stream`            | Streaming output      | true          |
| `response_format`   | Output type           | text / JSON   |

---

# Recommended Settings

| Task               | Temperature |   Top P | Max Tokens |
| ------------------ | ----------: | ------: | ---------: |
| Coding             |     0.0–0.2 |     1.0 |       1000 |
| Math               |         0.0 |     1.0 |       1000 |
| Question Answering |     0.2–0.5 |     1.0 |        500 |
| RAG                |     0.2–0.4 |     1.0 |       1000 |
| Customer Support   |         0.3 |     1.0 |        500 |
| Summarization      |         0.2 |     1.0 |        500 |
| Creative Writing   |     0.8–1.2 | 0.9–1.0 |       2000 |
| Brainstorming      |         1.0 |    0.95 |       1500 |

---

# Quick Cheat Sheet

```text
temperature        → Creativity
top_p              → Probability sampling
top_k              → Candidate token limit
max_tokens         → Response length
stop               → Stop generation
presence_penalty   → Encourage new topics
frequency_penalty  → Reduce repetition
seed               → Reproducible outputs
n                  → Multiple responses
stream             → Token-by-token output
response_format    → Text or JSON
```
