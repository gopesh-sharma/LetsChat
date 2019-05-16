const NLP = require('natural');
const fs = require('fs');
var csv = require('csv-parser'); 
const Discordie = require('discordie');
const Events = Discordie.Events;
const client = new Discordie();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

require('dotenv').config();

const classifier = new NLP.LogisticRegressionClassifier();
const token = process.env.DISCORD_API_TOKEN;

let trainedData = false;

client.connect({
    token: token
});
client.Dispatcher.on(Events.GATEWAY_READY, async e => {
    var trainedDataPath = 'trained-data.csv'
    var jsonData = await parseCSV(trainedDataPath);
    trainData(jsonData);
    console.log('Connected as: ' + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, async e => {
    if (e.message.author.bot) {
        return;
    }
    let content = e.message.content;
    await handleMessage(e, content);
});

async function parseCSV(path) {
    const results = [];
    let readStream = fs.createReadStream(path);
    let readStreamPromise = new Promise((resolve, reject) => {
        readStream.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error',() => reject);
    });
    return readStreamPromise;
}

function trainData(jsonData) {
    if(!trainedData) {
        jsonData.forEach(function(obj) { 
            classifier.addDocument(obj.question.toLowerCase(), obj.intent);
        });
        classifier.train();
        classifier.save('./classifier.json', (err, classifier) => {
            if (err) {
                console.error(err);
            }
            console.log('Created a Classifier file');
        });
        trainedData = true;
    }
}

async function handleMessage(e, message) {
  const probableAnswerPath = 'probable-answer.csv';
  let jsonData = await parseCSV(probableAnswerPath);
  let findClassifier = '';

  return NLP.LogisticRegressionClassifier.load('classifier.json', null, function(err, classifier) {
    console.log(analyzer.getSentiment(message.toLowerCase().split(" ")));
    findClassifier = classifier.classify(message.toLowerCase());
    let returnMessage = findAnswer(jsonData, findClassifier);
    e.message.channel.sendMessage(returnMessage);
  });
}

function findAnswer(answerData, findClassifier) {
    let botAnswer = "Sorry, I'm not sure what you mean";
    let result = answerData.filter(function (answer) {
        return answer.intent === findClassifier;
    })
    let obj_keys = Object.keys(result);
    let ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
    return result[ran_key].answer ? result[ran_key].answer : botAnswer;
}