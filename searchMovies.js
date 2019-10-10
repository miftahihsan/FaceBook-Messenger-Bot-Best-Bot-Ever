const fetch = require('node-fetch');
var request = require('request');
const cheerio = require('cheerio');

// 'https://www.rottentomatoes.com/search/?search=lion%20king'

// ROTTEN TOMATOES
// const URL = 'https://www.rottentomatoes.com/search/?search='

// IMDB
const URL = 'https://www.imdb.com/find?s=tt&ttype=ft&ref_=fn_ft&q='
const reviewUrlPart1 = 'https://www.imdb.com/title/'
const reviewUrlPart2 = '/reviews?ref_=tt_ov_rt'


const reviewList = [];

function searchMovie(searchTerm){
    return fetch(`${URL}${searchTerm}`)
    .then(response => response.text())
    .then(body => {
        
        var moviesList = [];
        // console.log(body)
        const cheerio = require('cheerio');
        const $ = cheerio.load(body);

        $('.findResult').each(function(i, elem) {
            const $element = $(elem);        

            const $title = $element.find('td.result_text a');
            const $imdbID = $title.attr('href').match(/title\/(.*)\//)[1];
            const $fullReviewUrl = reviewUrlPart1 + $imdbID + reviewUrlPart2;
            
            // console.log($title.text())
            const movie = {
                title: $title.text(),
                imdbID: $imdbID,
                reviewUrl: $fullReviewUrl

            };

            moviesList.push(movie);

        });
        
        // throw error
        
        console.log(moviesList);
        
        console.log(moviesList.length);
        
        if(moviesList.length == 0){
        //   throw 'error'
            return [ { title: 'Hello? Kaun Hai!',
                        imdbID: 'tt0783730',
                        reviewUrl: 'https://www.imdb.com/title/tt0783730/reviews?ref_=tt_ov_rt' } ]

        }
        

        return moviesList

    })
    .catch(function (error) {
        console.error("HERE " + error)
        throw error
      })
}


function searchSummary(movieID){
    // summary_text
    return fetch('https://www.imdb.com/title/'+movieID+'/?ref_=fn_al_tt_1')
    .then(response => response.text())
    .then(body => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(body);
        
        summary = $("div.summary_text").text();

        return summary
    })
    .catch(function (error){
        console.log("No Summar Found");
        throw error
    });

}

// function fetchTitleAndDescription(URL){

//     // id = tt0110357 will get appended to url1st

//     var url1st = "https://www.imdb.com/title/";
//     var url2nd = "/?ref_=fn_ft_tt_2";



//     return fetch(`${URL}`).then((response => response.text()));
// }


module.exports = {
    searchMovie,
    searchSummary
};
