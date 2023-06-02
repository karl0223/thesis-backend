function separateData(parsedText) {
  const lines = parsedText.split("\r\n");
  const subjectCode = [];
  const description = [];
  const grades = [];
  let startIndex = -1;

  // Find the starting index of the data (where "Subject Code" appears)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Subject Code")) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) {
    return {
      subjectCode,
      description,
      grades,
    };
  }

  // Extract subject code, description, and grades
  for (let i = startIndex; i < lines.length; i++) {
    const lineParts = lines[i].split("\t");

    if (lineParts.length >= 3) {
      subjectCode.push(lineParts[0]);
      description.push(lineParts[1]);
      grades.push(lineParts[2]);
    }
  }

  return {
    subjectCode,
    description,
    grades,
  };
}

function createSubjectArray(data) {
  const { subjectCode, description, grades } = data;
  const subjects = [];

  for (let i = 0; i < subjectCode.length; i++) {
    subjects.push({
      subjectCode: subjectCode[i],
      description: description[i],
      grade: grades[i],
    });
  }

  return subjects;
}

function filterSubjectData(data) {
  const { subjectCode, description, grades } = data;
  const filteredSubjects = [];

  for (let i = 0; i < subjectCode.length; i++) {
    const currentSubjectCode = subjectCode[i].toUpperCase();
    const currentDescription = description[i];
    const currentGrade = parseFloat(grades[i]);

    if (
      currentGrade <= 1.75 &&
      !currentSubjectCode.includes("GNED") &&
      !currentSubjectCode.includes("NSTP") &&
      !currentSubjectCode.includes("CVSU")
    ) {
      filteredSubjects.push({
        subjectCode: currentSubjectCode,
        description: currentDescription,
        grade: currentGrade,
      });
    }
  }

  return filteredSubjects;
}

export { separateData, createSubjectArray, filterSubjectData };
