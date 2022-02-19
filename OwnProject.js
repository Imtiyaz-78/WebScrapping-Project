
/*
// The Purpose of this Project is to Extract information of worldup 2019 from Cricinfo and Present  that in the form of excel and pdf Scorecards

// The real Purpose is to learn how to extract information and get Experience with JavaScript.

// A Very Good Reason to Ever make a Project is to have Good fun.


// To Make this Project required node Module   
// Step 1 :  npm install minimist 
// step 2 :  npm install axios
// Step 3 :  npm install jsdom
// Step 4 :  npm install excel4node
// Step 5 :  npm install pdf-lib

// node Project1.js --excel="Worldcup.csv" --dataFolder="data" --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"


let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel4node = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path"); 

let args = minimist(process.argv);


// Project Details:-
// 1. Download Data the using axios
// 2. read file using jsdom
// 3. Manipulate Data Using Arrat Funcrion 
// 4. Save in excel using excel4node 
// 5. Create A folder and Prepares PDF



let responseKaPromise = axios.get(args.source);
responseKaPromise.then(function (response) {
    let html = response.data;

    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;


    let matches = [];
    let matchInfoDivs = document.querySelectorAll("div.match-score-block");
    for (let i = 0; i < matchInfoDivs.length; i++) {
        let match = {

        };



        let namePs = matchInfoDivs[i].querySelectorAll("p.name"); // Team Name Paragraph 
        match.t1 = namePs[0].textContent;
        match.t2 = namePs[1].textContent;


        let scoreSpans = matchInfoDivs[i].querySelectorAll("div.score-details > span.score");
        if (scoreSpans == 2) {
            match.t1s = scoreSpans[0].textContent;
            match.t2s = scoreSpans[1].textContent;
        } else if (scoreSpans == 1) {
            match.t1s = scoreSpans[0].textContent;
            match.t2s = "";
        } else {
            match.t1s = "";
            match.t2s = "";

        }


        let spanResult = matchInfoDivs[i].querySelector("div.status-text > span"); // ek span jiska parent div.status-text
        match.result = spanResult.textContent;



        matches.push(match);

    }

    let matchesJSON = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesJSON, "utf-8");



    let teams = [];
    for (let i = 0; i < matches.length; i++) {
        putTeamsInTeamsArrayIfMissing(teams, matches[i]);
    }

    for (let i = 0; i < matches.length; i++) {
        putMatchInAppropriateTeam(teams, matches[i]);
    }

    let teamsJSON = JSON.stringify(teams);
    fs.writeFileSync("teams.json", teamsJSON, "utf-8");

    createExcelFile(teams);
    createFolder(teams);

})

function createFolder(teams) {

    fs.mkdirSync(args.dataFolder);


    for (let i = 0; i < teams.length; i++) {
        let teamFN = path.join(args.dataFolder, teams[i].name); // Making team folder name individual
        fs.mkdirSync(teamFN); // folder is created 

        for (let j = 0; j < teams[i].matches.length; j++) {
            let matchFileName = path.join(teamFN, teams[i].matches[j].vs + ".pdf");
            // createScoreCard(teams[i].name, teams[i].matches[j], matchFileName);
        }
    }


}


function createScoreCard(teamName, match, matchFileName) {
    let t1 = teamName;
    let t2 = match.vs;
    let t1s = match.selfScore;
    let t2s = match.oppScore;
    let result = match.result;

    let bytesOfPDFTemplate = fs.readFileSync("Template.pdf");
    let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfPDFTemplate);
    pdfdocKaPromise.then(function (pdfdoc) {
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x: 320,
            y: 744,
            size: 12
        });
        page.drawText(t2, {
            x: 320,
            y: 730,
            size: 12
        });

        page.drawText(t1s, {
            x: 320,
            y: 716,
            size: 12
        });


        page.drawText(t2s, {
            x: 320,
            y: 702,
            size: 12
        });


        page.drawText(result, {
            x: 320,
            y: 702,
            size: 12
        });

        let finalPDFBytesKaPromise = pdfdoc.save();
        finalPDFBytesKaPromise.then(function (finalPDFBytes) {
            fs.writeFileSync(matchFileName, finalPDFBytes);
        })
    })
}




// This is Create Excel File 
function createExcelFile(teams) {
    let wb = new excel4node.Workbook();

    for (let i = 0; i < teams.length; i++) {
        let sheet = wb.addWorksheet(teams[i].name);


        sheet.cell(1, 1).string("VS");
        sheet.cell(1, 2).string("Self Score");
        sheet.cell(1, 3).string("Oppo Score");
        sheet.cell(1, 4).string("Result");

        for (let j = 0; j < teams[i].matches.length; j++) {
            sheet.cell(2 + j, 1).string(teams[i].matches[j].vs);
            sheet.cell(2 + j, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(2 + j, 3).string(teams[i].matches[j].oppScore);
            sheet.cell(2 + j, 4).string(teams[i].matches[j].result);

        }

    }


    wb.write(args.excel); // => To manipulates in Excel jo app create kiye hai us sheet mein  

}


function putTeamsInTeamsArrayIfMissing(teams, match) {
    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1idx = i;
            break;
        }
    }


    if (t1idx == - 1) {
        teams.push({
            name: match.t1,
            matches: []
        });

    }



    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2idx = i;
            break;
        }
    }


    if (t2idx == - 1) {
        teams.push({
            name: match.t2,
            matches: []
        });

    }
}


function putMatchInAppropriateTeam(teams, match) {
    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1idx = i;
            break;
        }
    }


    let team1 = teams[t1idx];
    team1.matches.push({
        vs: match.t2,
        selfScore: match.t1s,
        oppScore: match.t2s,
        result: match.result
    });

    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2idx = i;
            break;
        }
    }

    let team2 = teams[t2idx];
    team2.matches.push({
        vs: match.t1,
        selfScore: match.t2s,
        oppScore: match.t1s,
        result: match.result
    });



}

*/