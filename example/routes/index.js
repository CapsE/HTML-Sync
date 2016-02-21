module.exports = function(express){

  var router = express.Router();

  /* GET home page. */
  router.get("/", function(req, res){
    res.render('index', {});
  });

  return router;
};
