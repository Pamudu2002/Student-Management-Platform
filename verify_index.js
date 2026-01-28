// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3000/api';

async function createClass(name, grade) {
  const res = await fetch(`${BASE_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, grade }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.class;
}

async function createStudent(name, classId) {
  const res = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, classId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.student;
}

async function verify() {
  try {
    console.log('--- Starting Verification ---');

    console.log('1. Verifying Grade 3 logic...');
    const class3 = await createClass('Grade 3 Test', 3);
    const s3_1 = await createStudent('Student 3-1', class3._id);
    console.log(`Student 1 (Grade 3) Index: ${s3_1.indexNumber} (Expected: 2804286)`);
    if (s3_1.indexNumber !== '2804286') console.error('FAILED');

    const s3_2 = await createStudent('Student 3-2', class3._id);
    console.log(`Student 2 (Grade 3) Index: ${s3_2.indexNumber} (Expected: 2804287)`);
    if (s3_2.indexNumber !== '2804287') console.error('FAILED');

    console.log('2. Verifying Grade 4 logic...');
    const class4 = await createClass('Grade 4 Test', 4);
    const s4_1 = await createStudent('Student 4-1', class4._id);
    console.log(`Student 1 (Grade 4) Index: ${s4_1.indexNumber} (Expected: 2704286)`);
    if (s4_1.indexNumber !== '2704286') console.error('FAILED');

    console.log('3. Verifying Grade 5 logic...');
    const class5 = await createClass('Grade 5 Test', 5);
    const s5_1 = await createStudent('Student 5-1', class5._id);
    console.log(`Student 1 (Grade 5) Index: ${s5_1.indexNumber} (Expected: 2604286)`);
    if (s5_1.indexNumber !== '2604286') console.error('FAILED');

    console.log('--- Verification Complete ---');
  } catch (err) {
    console.error('Verification Error:', err);
  }
}

verify();
