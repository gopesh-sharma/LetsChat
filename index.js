const NLP = require('natural');
const fs = require('fs');
const Discordie = require('discordie');
const Events = Discordie.Events;
const client = new Discordie();
require('dotenv').config();

const classifier = new NLP.LogisticRegressionClassifier();
const token = process.env.DISCORD_API_TOKEN;

let trainedData = false;
client.connect({
    token: token
});
client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.author.bot) {
        return;
    }
    let content = e.message.content;
    let returnMessage = handleMessage(content);
    e.message.channel.sendMessage(returnMessage);
});

function handleMessage(message) {
  const myData = JSON.parse(fs.readFileSync("./data.json"));
  if(!trainedData) {
    Object.keys(myData).forEach((e, key) => {
      myData[e].questions.forEach((phrase) => {
          classifier.addDocument(phrase.toLowerCase(), e);
      }) 
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
  let botAnswer = "Sorry, I'm not sure what you mean";
  const guesses = classifier.getClassifications(message.toLowerCase());
  const guess = guesses.reduce((x, y) => x && x.value > y.value ? x : y);
  console.log(guesses);
  console.log(guess)
  console.log(myData);
  if(guess.value > (0.6) && myData[guess.label]) {
      botAnswer = myData[guess.label].answer;
  }
  return botAnswer;
}