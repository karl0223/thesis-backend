import hbs from "hbs";

function parseJSONHelper(context, options) {
  try {
    const parsedData = JSON.parse(context.replace(/&quot;/g, '"'));
    console.log("parsed data", parsedData);
    return options.fn(parsedData);
  } catch (error) {
    return options.inverse(error);
  }
}

function tutorRequestPrint() {
  return "<tr>" +
         "<td>" + this.userId.firstName + " " + this.userId.lastName + "</td>" +
         "<td>" + this.briefIntro + "</td>" +
         "<td>" + this.userId.email + "</td>" +
         "<td>" + 
         "<button type='button' class='btn btn-primary' data-bs-toggle='modal' data-bs-target='#modal" + this.userId._id + "'><i class='bi bi-eye'></i> View</button> " +
         "<a type='button' class='btn btn-success' href='/admin/tutor-application/"+ this._id +"/approve'><i class='bi bi-check'></i> Accept</a> " +
         "<a type='button' class='btn btn-danger' href='/admin/tutor-application/"+ this._id +"/rejected'><i class='bi bi-x'></i> Reject</a> " +
         "</td>" +
         "</tr>";
}

function createModals(){
  return '<div class="modal fade"' + "id='modal"+ this.userId._id +"'" + 'tabindex="-1" role="dialog" aria-hidden="true">' +
  '<div class="modal-dialog"> '+
    '<div class="modal-content">'+
      '<div class="modal-header">'+
        '<h5 class="modal-title">' + this.userId.firstName + " " + this.userId.lastName +'</h5>'+
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
      '</div>'+
      '<div class="modal-body">'+
       '<h5>Teaching Experience</h5>'+
        '<p>' + this.teachingExperience + '</p>'+
        '<h5>Grades:</h5>'+
        '<div class="text-center">' +
          '<image class="img-fluid" src="' + this.grades + '" alt="tutor image" width="300" height="300">'+
        '</div>'+
      '</div>'+
      '<div class="modal-footer">'+
        '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>';
}

function printEmptyTr() {
  var isEmpty = this.length == 0;
  if (isEmpty) {
    return "<tr id='emptyTr'><td colspan='4'>No tutor application found.</td></tr>";
  }
}


function parseAsHtmlHelper(context) {
  return new hbs.handlebars.SafeString(context);
}


export { parseJSONHelper, tutorRequestPrint, parseAsHtmlHelper, createModals, printEmptyTr };
