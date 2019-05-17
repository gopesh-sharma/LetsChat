const fs = require('fs');
var csv = require('csv-parser'); 
const Discordie = require('discordie');
const Events = Discordie.Events;
const client = new Discordie();
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'] });
const trainnlp = require('./data/train-nlp');
const threshold = 0.5;
const modelPath = 'model/model.nlp';
const trainedDataPath = 'data/qatraining1.csv';
const unmatchedFile = 'unmatched/data.txt';

require('dotenv').config();

const token = process.env.DISCORD_API_TOKEN;

client.connect({
    token: token
});
client.Dispatcher.on(Events.GATEWAY_READY, async e => {
    let jsonData = await parseCSV(trainedDataPath);
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
    fs.access(modelPath, fs.constants.F_OK, (err) => {
        if(err) {
            console.log(err);
            train(jsonData)
        } else {
            console.log('trained...');
            manager.load(modelPath);
        }
    });
}

async function train(jsonData) {
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
    manager.save(modelPath);
}

async function handleMessage(e, message) {
  const response = await manager.process('en', message); 
  const answer = response.score > threshold && response.answer ? response.answer: "Sorry, I don't know what do you mean";
  console.log(response);
  const unmatcheResponse = response.score < threshold ? `Message : ${message} - response : ${answer}\n` : '';
  fs.appendFile(unmatchedFile, unmatcheResponse, function () { });
  e.message.channel.sendMessage(answer);
}