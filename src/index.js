const NLP = require('natural');
const fs = require('fs');
var csv = require('csv-parser'); 
const Discordie = require('discordie');
const Events = Discordie.Events;
const client = new Discordie();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'] });
const trainnlp = require('./train-nlp');
const threshold = 0.5;

require('dotenv').config();

const classifier = new NLP.LogisticRegressionClassifier();
const token = process.env.DISCORD_API_TOKEN;

client.connect({
    token: token
});
client.Dispatcher.on(Events.GATEWAY_READY, async e => {
    var trainedDataPath = 'qatraining1.csv';
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
            .on('end', () => {
                var rows = JSON.parse(JSON.stringify(results));
                resolve(rows);
            })
            .on('error',() => reject);
    });
    return readStreamPromise;
}

function trainData(jsonData) {
    fs.access('model.nlp', fs.constants.F_OK, (err) => {
        if(err) {
            console.log(err);
            train(jsonData, classifier)
        } else {
            console.log('trained...');
            manager.load('model.nlp');
        }
    });
}

async function train(jsonData, classifier) {
    jsonData.forEach(function(obj) { 
        manager.addDocument('en', obj.question.toLowerCase(), obj.intent + obj.counter);
        manager.addAnswer('en', obj.intent + obj.counter, obj.answer.toLowerCase());
    });
    await trainnlp(manager);
    console.log('Awaiting for training')
    const hrstart = process.hrtime();
    await manager.train();
    const hrend = process.hrtime(hrstart);
    console.info('Trained (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
    manager.save('model.nlp');
}

async function handleMessage(e, message) {
  const response = await manager.process('en', message); 
  const answer = response.score > threshold && result.answer ? result.answer: "Sorry, I don't know what do you mean";
  
  e.message.channel.sendMessage(response.answer);
}