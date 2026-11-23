
const questions = {
  bn: [
    {
      question: "বাংলাদেশের জাতীয় ফুল কোনটি?",
      options: { a: "গোলাপ", b: "শাপলা", c: "জবা", d: "বেলি" },
      answer: "b"
    },
    {
      question: "বাংলাদেশের রাজধানী কোনটি?",
      options: { a: "চট্টগ্রাম", b: "খুলনা", c: "ঢাকা", d: "রাজশাহী" },
      answer: "c"
    },
    {
      question: "বাংলাদেশের জাতীয় ফল কোনটি?",
      options: { a: "আম", b: "কাঁঠাল", c: "লিচু", d: "জাম" },
      answer: "b"
    },
    {
      question: "পৃথিবীর সবচেয়ে বড় মহাসাগর কোনটি?",
      options: { a: "আটলান্টিক", b: "ভারত", c: "প্রশান্ত", d: "আর্কটিক" },
      answer: "c"
    },
    {
      question: "বাংলাদেশের স্বাধীনতা দিবস কবে?",
      options: { a: "২১ ফেব্রুয়ারি", b: "২৬ মার্চ", c: "১৬ ডিসেম্বর", d: "১৪ এপ্রিল" },
      answer: "b"
    }
  ],

  en: [
    {
      question: "What is the capital of Bangladesh?",
      options: { a: "Chittagong", b: "Dhaka", c: "Khulna", d: "Rajshahi" },
      answer: "b"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: { a: "Earth", b: "Venus", c: "Mars", d: "Jupiter" },
      answer: "c"
    },
    {
      question: "How many days are there in a leap year?",
      options: { a: "364", b: "365", c: "366", d: "367" },
      answer: "c"
    },
    {
      question: "Which is the largest ocean?",
      options: { a: "Atlantic", b: "Indian", c: "Pacific", d: "Arctic" },
      answer: "c"
    },
    {
      question: "What is the national flower of Bangladesh?",
      options: { a: "Rose", b: "Water Lily", c: "Lotus", d: "Sunflower" },
      answer: "b"
    }
  ]
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "2.0",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    description: {
      bn: "কুইজ খেলে কয়েন ও XP জিতুন",
      en: "Play quiz and win coins and XP"
    },
    category: "game",
    guide: {
      bn: "{pn} bn অথবা {pn} en",
      en: "{pn} bn or {pn} en"
    }
  },

  langs: {
    bn: {
      reply: "উত্তর দিতে A, B, C অথবা D লিখে Reply করো।",
      correct: "✅ সঠিক উত্তর! তুমি পেয়েছো %1 কয়েন ও %2 XP।",
      wrong: "❌ ভুল উত্তর! সঠিক উত্তর ছিল: %1",
      notYour: "এই Quiz টি তোমার জন্য নয়!",
      error: "সমস্যা হয়েছে: %1"
    },
    en: {
      reply: "Reply with A, B, C or D.",
      correct: "✅ Correct! You earned %1 coins and %2 XP.",
      wrong: "❌ Wrong answer! The correct answer was: %1",
      notYour: "This quiz is not yours!",
      error: "An error occurred: %1"
    }
  },

  onStart: async function ({ api, event, args, getLang }) {
    try {
      const input = args.join("").toLowerCase();
      const language =
        input === "en" || input === "english" ? "en" : "bn";

      const list = questions[language];
      const quiz = list[Math.floor(Math.random() * list.length)];

      const { a, b, c, d } = quiz.options;

      const quizMsg =
        `╭──✦ ${quiz.question}\n\n` +
        `├ A) ${a}\n` +
        `├ B) ${b}\n` +
        `├ C) ${c}\n` +
        `├ D) ${d}\n` +
        `╰──────────────\n\n` +
        getLang("reply");

      api.sendMessage(
        quizMsg,
        event.threadID,
        (err, info) => {
          if (err || !info) return;

          global.GoatBot.onReply.set(info.messageID, {
            type: "reply",
            commandName: this.config.name,
            author: event.senderID,
            messageID: info.messageID,
            answer: quiz.answer,
            options: quiz.options,
            language
          });

          setTimeout(() => {
            global.GoatBot.onReply.delete(info.messageID);
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        event.messageID
      );

    } catch (error) {
      return api.sendMessage(
        getLang("error", error.message),
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async function ({
    event,
    api,
    Reply,
    usersData,
    getLang
  }) {
    try {
      if (event.senderID !== Reply.author) {
        return api.sendMessage(
          getLang("notYour"),
          event.threadID,
          event.messageID
        );
      }

      const userReply = String(event.body || "")
        .trim()
        .toLowerCase()
        .replace(/[).]/g, "");

      const selected = userReply.replace(/^[a-d]\s*/, "");

      const answer = Reply.answer;
      const correctOption = Reply.options[answer];

      const isCorrect =
        selected === answer ||
        selected === correctOption.toLowerCase();

      global.GoatBot.onReply.delete(Reply.messageID);

      await api.unsendMessage(Reply.messageID);

      if (isCorrect) {
        const author = Reply.author;
        const userData = await usersData.get(author);

        const rewardCoins = 500;
        const rewardExp = 121;

        await usersData.set(author, {
          money: Number(userData.money || 0) + rewardCoins,
          exp: Number(userData.exp || 0) + rewardExp,
          data: userData.data
        });

        return api.sendMessage(
          getLang("correct", rewardCoins, rewardExp),
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
        getLang("wrong", `${answer.toUpperCase()}) ${correctOption}`),
        event.threadID,
        event.messageID
      );

    } catch (error) {
      return api.sendMessage(
        getLang("error", error.message),
        event.threadID,
        event.messageID
      );
    }
  }
};
