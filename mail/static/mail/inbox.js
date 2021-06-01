document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {

  // Getting mail info
  var recipients = document.querySelector('#compose-recipients').value
  var subject = document.querySelector('#compose-subject').value
  var body = document.querySelector('#compose-body').value

  if(recipients != ''){
    var valid = true;
    // separating multiple recipients 
    var recs = recipients.split(", ");

    if(valid){
      for (mail in recs){
        fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
              recipients: recs[mail],
              subject: subject,
              body: body
          })
        })
        .then(response => response.json())
        .then(result => {
          // Print result
          console.log(result);

          var message = document.querySelector("#message");

          // display error message 
          if (result['error']){
            //generates error message
            message.innerHTML = `User with ${recs[mail]} does NOT exist`;
            message.style.color = 'red';
            
          }

          // evrething went ok 
          else{
            message.innerHTML = `Email succesfully sent!`;
            message.style.color = 'green';

            //load user's sent mailbox
            load_mailbox('inbox');            
          }
        });
      }
    }
  }
  else{
    var message = document.querySelector("#message");
    //generates a message on that page.
    message.innerHTML = `Please enter a valid email`;
    message.style.color = 'red';
  }
}
  
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show user emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print result
    console.log(emails);

    emails_view = document.querySelector('#emails-view')
    
    if(emails == 0){
      emails_view.innerHTML = `<h5 class="alert alert-secondary col-md-5">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)} is empty</h5>`;
    }

    else{
      // iterate emails 
      for(email in emails){

        var mail = document.createElement("div");
        var sender = document.createElement('h5');
        var subject = document.createElement('p');
        var time = document.createElement('p');
        var id = document.createElement('p');
        
        mail.classList.add('container');
        mail.classList.add('mail');

        // check for read emails 
        if(emails[email]['read']){
          mail.style.backgroundColor = "lightgray";
        }

        // add some style 
        mail.classList.add("list-group-item");
        sender.style.float = "left";
        subject.style.display = "inline-block";
        subject.style.padding = "0px 20px";
        time.style.float = "right";
        id.style.display = "none";

        sender.innerHTML = emails[email]['sender'];
        subject.innerHTML = emails[email]['subject'];
        time.innerHTML = emails[email]['timestamp'];
        id.innerHTML = emails[email]['id'];

        emails_view.appendChild(mail);
        mail.appendChild(sender);
        mail.appendChild(subject);
        mail.appendChild(time);
        mail.appendChild(id);
        
        // email opening
        mail.addEventListener('click', () => open_email());
      }
    }
  });
}

function open_email() {
  event.stopImmediatePropagation();

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  email_view = document.querySelector('#emails-view');

  var tar = event.target;

  //if the clicked element is not div select its parent
  if (!(tar.tagName == 'DIV')) {
    tar = tar.parentElement;
  }

  //get id from the divs 'child'
  var c = tar.children;
  var id = c['3'].innerHTML;

  // Show user emails
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    if(!email['read']){
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    // Print result
    console.log(email);

    // clearing old div 
    email_view.innerHTML = '';

    // creating html elements 
    var br = document.createElement('br');
    var mail = document.createElement('div');
    var sender = document.createElement('h5');
    var subject = document.createElement('p');
    var body = document.createElement('p');
    var time = document.createElement('p');

    // add some style 
    body.style.backgroundColor = 'lightgray';
    body.style.padding = '15px';

    sender.innerHTML = email['sender'];
    subject.innerHTML = email['subject'];
    body.innerHTML = email['body'];
    time.innerHTML = email['timestamp'];

    // split \n in body 
    if(body.innerHTML.search('\n')){

      parts = body.innerHTML.split("\n");
      // clear old body formatation
      body.innerHTML = "";
      parts.forEach(function (part) {
        var p = document.createElement('p');
        p.innerText = part;
        
        body.append(p)
      })
    }
    
    mail.appendChild(br);
    mail.appendChild(sender);
    mail.appendChild(subject);
    mail.appendChild(body);
    mail.appendChild(time);

    // creating buttons
    var archive = document.createElement('button');
    var reply = document.createElement('button');
    var back = document.createElement('button');

    //Adding buttons from here on
    var arch = email['archived'];

    if(arch){
      archive.innerHTML = 'Unarchive';
    }
    else{
      archive.innerHTML = 'Archive';
    }
    
    reply.innerHTML = 'Reply';
    back.innerHTML = 'Go Back';

    // styling buttons
    back.classList.add('btn','btn-secondary', 'btn-sm');
    reply.classList.add('btn', 'btn-sm', 'btn-outline-primary');
    archive.classList.add('btn', 'btn-sm', 'btn-outline-primary');

    email_view.appendChild(back);
    email_view.appendChild(mail);
    email_view.appendChild(archive);
    email_view.appendChild(reply);

    // adding event listeners
    back.addEventListener('click', () => {
      // load mailbox 
      load_mailbox('inbox');
    })

    // archive function 
    archive.addEventListener('click', () => {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !arch
        })
      });
      //loading inbox
      load_mailbox('inbox');
    });

    //reply function
    reply.addEventListener('click', () => {

      //opens the compose mail section
      compose_email();

      email_body = `\n\nOn ${email['timestamp']}, ${email['sender']} wrote:\n${email['body']}`;
      //setting default values as specified
      document.querySelector('#compose-recipients').value = email['sender'];
      document.querySelector('#compose-body').value = email_body;
      //checking for subject
      if (email['subject'].search('Re:') === -1) {
        document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
      }
      else {
        document.querySelector('#compose-subject').value = `${email['subject']}`;
      }
    });    
  });
}