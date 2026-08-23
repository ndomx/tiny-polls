migrate((app) => {
  const polls = new Collection({
    type: "base",
    name: "polls",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "codename",
        type: "text",
        required: true,
        max: 120,
        presentable: true,
      },
      {
        name: "name",
        type: "text",
        required: true,
        max: 160,
      },
      {
        name: "question",
        type: "text",
        required: true,
        max: 500,
      },
      {
        name: "description",
        type: "text",
        max: 1000,
      },
      {
        name: "stage",
        type: "text",
        max: 120,
      },
      {
        name: "audience",
        type: "text",
        max: 160,
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["draft", "open", "closed"],
      },
      {
        name: "expiresAt",
        type: "date",
        required: true,
      },
      {
        name: "minSelections",
        type: "number",
        required: true,
        min: 1,
        onlyInt: true,
      },
      {
        name: "maxSelections",
        type: "number",
        required: true,
        min: 1,
        onlyInt: true,
      },
      {
        name: "options",
        type: "json",
        required: true,
      },
      {
        name: "correctAnswerIds",
        type: "json",
        required: false,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_polls_codename ON polls (codename)",
      "CREATE INDEX idx_polls_status ON polls (status)",
    ],
  });

  app.save(polls);

  const submissions = new Collection({
    type: "base",
    name: "submissions",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "poll",
        type: "relation",
        required: true,
        collectionId: polls.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "pollCodename",
        type: "text",
        required: true,
        max: 120,
      },
      {
        name: "voterId",
        type: "text",
        required: true,
        max: 80,
      },
      {
        name: "voterName",
        type: "text",
        required: true,
        max: 160,
      },
      {
        name: "source",
        type: "text",
        required: true,
        max: 120,
      },
      {
        name: "utmSource",
        type: "text",
        max: 160,
      },
      {
        name: "utmMedium",
        type: "text",
        max: 160,
      },
      {
        name: "utmCampaign",
        type: "text",
        max: 160,
      },
      {
        name: "selectedOptionIds",
        type: "json",
        required: true,
      },
      {
        name: "isCorrect",
        type: "bool",
        required: false,
      },
      {
        name: "submittedAt",
        type: "date",
        required: true,
      },
      {
        name: "userAgent",
        type: "text",
        max: 500,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_submissions_poll_voter ON submissions (poll, voterId)",
      "CREATE INDEX idx_submissions_poll_submitted ON submissions (poll, submittedAt)",
      "CREATE INDEX idx_submissions_poll_codename_submitted ON submissions (pollCodename, submittedAt)",
      "CREATE INDEX idx_submissions_source ON submissions (source)",
    ],
  });

  app.save(submissions);

  const seedPoll = new Record(polls);
  seedPoll.load({
    codename: "baby-guess-stage-1",
    name: "Baby Guess - Stage 1",
    question: "Which name do you think we picked?",
    description: "Choose one answer. Results update after every vote.",
    stage: "Stage 1",
    audience: "Family and friends",
    status: "open",
    expiresAt: "2026-09-01 03:59:59.000Z",
    minSelections: 1,
    maxSelections: 1,
    correctAnswerIds: ["sofia"],
    options: [
      { id: "sofia", label: "Sofia" },
      { id: "emma", label: "Emma" },
      { id: "lucia", label: "Lucia" },
      { id: "isabella", label: "Isabella" },
    ],
  });

  app.save(seedPoll);
}, (app) => {
  try {
    const submissions = app.findCollectionByNameOrId("submissions");
    app.delete(submissions);
  } catch (_) {
    // Collection may not exist if the migration failed before creating it.
  }

  try {
    const polls = app.findCollectionByNameOrId("polls");
    app.delete(polls);
  } catch (_) {
    // Collection may not exist if the migration failed before creating it.
  }
});
