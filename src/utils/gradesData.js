function convertTextToRawData(text) {
  const lines = text.split("\n");
  const subjectCodeIndex = lines.indexOf("Subject Code");
  const descriptionIndex = lines.indexOf("Description");
  const gradeIndex = lines.indexOf("Grade");

  const subjectCode = lines
    .slice(subjectCodeIndex + 1, descriptionIndex - 1)
    .map((line) => line.trim());
  const description = lines
    .slice(descriptionIndex + 1, gradeIndex - 1)
    .map((line) => line.trim());
  const grade = lines
    .slice(gradeIndex + 1)
    .map((line) => parseFloat(line.trim()));

  const rawData = {
    "Subject Code": subjectCode.filter(Boolean),
    Description: description.filter(Boolean),
    Grade: grade.filter(Boolean),
  };

  return rawData;
}

function formatSubjectData(rawData) {
  const subjectCode = rawData["Subject Code"];
  const description = rawData.Description;
  const grade = rawData.Grade;

  const subjects = [];
  for (let i = 0; i < subjectCode.length; i++) {
    if (grade[i] <= 1.75) {
      const subject = {
        subjectCode: subjectCode[i],
        description: description[i],
        grade: grade[i],
      };
      subjects.push(subject);
    }
  }
  return subjects;
}

export { convertTextToRawData, formatSubjectData };
