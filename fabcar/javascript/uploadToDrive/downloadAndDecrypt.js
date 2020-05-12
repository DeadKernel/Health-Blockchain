// adiaholic: this is to initialise google apis for google drive through nodeJS
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const encrypt = require('node-file-encrypt');

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

var propertiesPath = './properties.json';
var config_data = require(propertiesPath);

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  
  var promiseObj = new Promise((resolve, reject) => {
    authorize(JSON.parse(content), downloading, resolve); 
  });
  promiseObj.then(decrypting,downloadFailed);
})

function downloadFailed(){
  console.log("Error in Downloading :(");
}

/**
 * Defining the async decrypting function
*/
async function decrypting() {

    console.log("Decrypting");

    let encryptPath = './encrypted';
    let decryptPath = './decrypted';

    fs.readdir(encryptPath, (err, files) => {
      files.forEach(file => {
        var encryptFilePath = encryptPath + '/' +file;
        console.log(`File decrypted at location : ${decryptPath}`);
        let f = new encrypt.FileEncrypt(encryptFilePath,decryptPath); // decrypt file
        f.openSourceFile();
        f.decrypt('111111');
      });
    });
}

/**
  * The async download function
**/
function downloading(auth, resolve) {

  console.log("Downloading");
  try {
    var folderID = config_data[`folderID`];
    console.log("folderID :" ,folderID);
  } catch(err) {
    console.log("Error accessing properties or downloading",err);
  }   

  const drive = google.drive({version: 'v3', auth});
  
  drive.files.list({
      fields: 'nextPageToken, files(id, name)',
      q: `'${folderID}' in parents and name contains ".crypt" and trashed = false`
  },function (err, res) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
        const files = res.data.files;
        if (files.length) {
          files.map((file) => {
            // Get name and ID of each file.
            var fileId = file.id;
            var fileName = file.name;
            console.log("FileName : ",fileName);
            
            var dest = fs.createWriteStream(`./encrypted/${fileName}`);

            drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
                function(err, res){
                    res.data
                    .on('end', () => {
                        console.log('Done');
                        resolve();
                    })
                    .on('error', err => {
                        console.log('Error', err);
                    })
                    .pipe(dest);
                }
            );
          });
        }
      }
    });
}

  /*drive.files.list({
      fields: 'nextPageToken, files(id, name)',
      q: `'${folderID}' in parents and name contains ".crypt" and trashed = false`
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        // Generate list of files.
        const files = res.data.files;
        if (files.length) {
          files.map((file) => {
            // Get name and ID of each file.
            var fileId = file.id;
            var fileName = file.name;
            var dest = fs.createWriteStream(`./encrypted/${fileName}`);

            drive.files.get({                    // Begin download request for file by ID.
              fileId: fileId,
            }, {
              responseType: 'stream'
            }, function(err, res) {
              console.log("Inside here");
              res.data
              .on('end', () => {
                console.log('Done.');
              })
              .on('error', err => {
                  console.log(err);
              })
              .pipe(dest);
            });
          });
        }
        resolve();
        console.log("Download complete");
      })*/
  

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, resolve) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,resolve);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}
