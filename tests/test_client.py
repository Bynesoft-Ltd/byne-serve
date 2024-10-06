from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

test_model = "Boriscii/finbert"

## Pass case
pipe = pipeline("text-classification", model=test_model, trust_remote_code=True)
print(pipe("Stocks rallied and the British pound gained."))

## Fail case
tokenizer = AutoTokenizer.from_pretrained(test_model)
model = AutoModelForSequenceClassification.from_pretrained(test_model, trust_remote_code=True)
print(model(torch.rand(1, 3)))
