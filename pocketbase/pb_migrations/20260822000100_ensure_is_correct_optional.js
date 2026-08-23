migrate((app) => {
  const submissions = app.findCollectionByNameOrId("submissions");
  const isCorrect = submissions.fields.getByName("isCorrect");

  isCorrect.required = false;
  app.save(submissions);
}, (app) => {
  const submissions = app.findCollectionByNameOrId("submissions");
  const isCorrect = submissions.fields.getByName("isCorrect");

  isCorrect.required = true;
  app.save(submissions);
});
