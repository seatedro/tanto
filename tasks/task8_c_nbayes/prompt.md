Simplified Naive Bayes Classifier

Implement a simplified Naive Bayes classifier for binary classification in C. Do not use any external libraries for classification.

Input:

The input is provided as a string in CSV format. The first line is a header row with the column names. The last column is the “label” (class). All features and the label are binary (0 or 1).

After the CSV training data, there is a line containing a single integer, T, representing the number of test examples. This is followed by T lines, each representing a test example. A test example is given as comma-separated values corresponding to the features (in the same order as in the header, but without the label).

Processing:
	1.	Parsing:
	•	Read and parse the CSV training data into an appropriate data structure.
	•	Parse the integer T and then the T test examples.
	2.	Training (Model Building):
	•	Compute Prior Probabilities:
	•	Calculate the probability for each class (0 and 1) based on their frequencies in the training data.
	•	Compute Conditional Probabilities:
	•	For each feature and for each class, compute the conditional probability:

P(feature = value | class = c)


	•	Use Laplace smoothing with a smoothing parameter of 1 to avoid zero probabilities. For example, if a feature has two possible values (0 and 1), then for class c:

P(feature = value | class = c) = (count(feature = value and class = c) + 1) / (count(class = c) + 2)


	3.	Classification:
	•	For each test example:
	•	Compute the posterior probability for each class using:

Posterior(c) = Prior(c) * ∏ [P(feature_i = value_i | class = c)]

where the product is taken over all features.

	•	Compare the posterior probabilities for class 0 and class 1.
	•	Assign the test example to the class with the higher posterior probability. In case of a tie, choose class 1.

Output:

Output a single string containing the predicted class labels (0 or 1) for the test examples. The predictions should be output as a comma-separated list, in the same order as the test examples were provided. Print the output to standard out with no additional text.

Example:

Given the following input:

f1,f2,label
0,1,0
1,0,1
1,1,1
0,0,0
2
1,0
0,1

Your program should process the training data to build the model, classify the two test examples (1,0 and 0,1), and output something like:

1,0
