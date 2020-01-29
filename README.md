# LetsChat

A Discord ChatBot written in Node.js and using basic Machine Learning. Added Natural Language Processing (NLP) to understand the human language to get started with ChatBot. The importance of NLP in a ChatBot is that you have to know the context of the message of the user. The NLP is a field of Machine Learning which will understand, analyze, manipulate and then generate human language thus helps to get the context of the message to reply.

I am using natural npm package for Natural Language Processing. As per the package, the definition of “natural” is

>“Natural” is a general natural language facility for nodejs. Tokenizing, stemming, classification, phonetics, tf-idf, WordNet, string similarity, and some inflections are currently supported.

Blog Post : https://www.gopeshsharma.dev/blog/discord-chatbot-using-machine-learning/

### Version - v1.0.0

In this version it takes a simple JSON file, add the questions as a document and then give answer based on the intent of the sentence a user types. The problem with this approach is that the reply is not natural as it will always give the same answer to all the people who asks the same question.

### Version - v1.1.0

This version is little better in terms of giving different reply, as I have trained the model with different questions and its probable answers. I have used two trained-data.csv for training it with questions and intent whereas probable-answer.csv will have the answers based on the intent.

A Basic Chat looks like:

![discord](https://user-images.githubusercontent.com/7776994/57831059-b2043080-77d1-11e9-8596-a149cab80cad.PNG)
[![Run on Repl.it](https://repl.it/badge/github/gopesh-sharma/LetsChat)](https://repl.it/github/gopesh-sharma/LetsChat)

