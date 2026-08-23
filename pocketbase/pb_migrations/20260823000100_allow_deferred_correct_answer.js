migrate((app) => {
  const polls = app.findCollectionByNameOrId("polls");
  const correctAnswerIds = polls.fields.getByName("correctAnswerIds");

  correctAnswerIds.required = false;
  app.save(polls);
}, (app) => {
  const polls = app.findCollectionByNameOrId("polls");
  const correctAnswerIds = polls.fields.getByName("correctAnswerIds");

  correctAnswerIds.required = true;
  app.save(polls);
});
