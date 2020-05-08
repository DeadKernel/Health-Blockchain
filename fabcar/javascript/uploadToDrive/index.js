// adiaholic: this is to initialise google apis for google drive through nodeJS
const fs = require('fs');

const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), createAndInsert);
  });

function createAndInsert(auth) {

  // The ID of the folder
  var folderID;

  // Create folder
  var fileMetadata = {
    'name': 'Folder',
    'mimeType': 'application/vnd.google-apps.folder'
  };
  const drive = google.drive({version: 'v3', auth});
  
  //Creates folder
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }).then(function (response) {
		  folderID = response.data.id;
	    console.log("adiaholic: FolderID",folderID);

      var propertiesPath = './properties.json';
      var config_data = require(propertiesPath);

      try {
        config_data[`folderID`] = folderID;
        console.log("Json : ",config_data);

        // stringify JSON Object
        var jsonContent = JSON.stringify(config_data);
        console.log(jsonContent);
         
        var fs = require('fs');

        fs.writeFileSync("./properties.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
          })

      } catch(err) {
        console.log("Error creating properties",err);
      }

      // Adding virtu
      const Virtru = require('virtru-sdk');
      var fs = require('fs');

      const email = 'projectpict17@gmail.com';
      const appId = 'db5ba273-4ea3-495d-ada6-2293df3c1134';
      const sourceDir = '/home/adiaholic/Desktop/GD/input';
      const destDir = '/home/adiaholic/Desktop/GD/encrypted';

      // For Encryption
      // Initialize the client.
      const client = new Virtru.Client({email, appId});
      
      // For each file in the directory, encrypt using the helper function.
      promises = fs.readdirSync(sourceDir).map(filename => encrypt(filename));
      // Wait for all operations to finish, then write a completion message.
      Promise.all(promises).then(() => 
        console.log(`All files in ${sourceDir} have been encrypted and written to ${destDir}!`));

      var encryptFile;

      async function encrypt(filename) {
        const encryptParams = new Virtru.EncryptParamsBuilder()
          .withFileSource(`${sourceDir}/${filename}`)
          .build();
        encryptFile = await client.encrypt(encryptParams);
        
        // This will create an encypted file on local machine
        //encryptFile.toFile(`${destDir}/${filename}.tdf3.html`);

        //Inserts file inside folder
        var fileMetadata = {
        'name': `${filename}.tdf3.html`,
        parents: [folderID]
        };
        var media = {
          mimeType: 'image/jpeg',
          body: encryptFile
        };
        drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id'
        }).then(function (response) {
          console.log("adiaholic: FileID",response.data.id);
        },
         function(err) {
          console.error("Execute Error", err);
         });
      }
    })
  }

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
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
