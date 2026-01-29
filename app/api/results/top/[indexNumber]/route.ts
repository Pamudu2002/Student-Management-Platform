import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Student from '@/models/Student';
import Paper from '@/models/Paper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indexNumber: string }> }
) {
  try {
    await dbConnect();
    const { indexNumber } = await params;

    const student = await Student.findOne({
      indexNumber: indexNumber,
    }).populate('classId');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Count total students in the class
    const totalStudents = await Student.countDocuments({
      classId: student.classId,
    });

    // Determine the limit for top results
    const limit = totalStudents > 10 ? 10 : 5;

    let topResults: any[] = [];
    let recentPaper: any = null;
    
    if (student.grade === 5) {
      // Find latest Main Paper
      const recentMainPaper = await Paper.findOne({ 
        classId: student.classId, 
        isMainPaper: true 
      }).sort({ createdAt: -1 });

      // Find latest Normal Paper
      const recentNormalPaper = await Paper.findOne({ 
        classId: student.classId, 
        isMainPaper: false 
      }).sort({ createdAt: -1 });

      recentPaper = recentMainPaper || recentNormalPaper;

      if (recentMainPaper) {
        const mainResults = await Result.find({ paperId: recentMainPaper._id })
          .populate('studentId')
          .populate('paperId')
          .sort({ totalMarks: -1 })
          .limit(limit + 5); // Fetch extra for potential ties/filtering
        topResults.push(...mainResults);
      }

      if (recentNormalPaper) {
        const normalResults = await Result.find({ paperId: recentNormalPaper._id })
          .populate('studentId')
          .populate('paperId')
          .sort({ totalMarks: -1 })
          .limit(limit + 5);
        topResults.push(...normalResults);
      }
    } else {
      // For other grades, just get the most recent paper
      const papers = await Paper.findOne({ classId: student.classId })
        .sort({ createdAt: -1 })
        .limit(1);

      recentPaper = papers;

      if (papers) {
        const results = await Result.find({
          paperId: papers._id,
          classId: student.classId,
        })
          .populate('studentId')
          .populate('paperId')
          .sort({ totalMarks: -1 });

        // Group by student and keep only their best result (though per paper there should be one)
        const studentBestResults = new Map();
        for (const result of results) {
          const studentId = result.studentId._id.toString();
          if (!studentBestResults.has(studentId) || 
              result.totalMarks > studentBestResults.get(studentId).totalMarks) {
            studentBestResults.set(studentId, result);
          }
        }
        // Convert to array and sort by total marks
        topResults = Array.from(studentBestResults.values())
          .sort((a, b) => b.totalMarks - a.totalMarks)
          .slice(0, limit);
      }
    }

    return NextResponse.json(
      {
        student,
        paper: recentPaper,
        topResults: topResults,
        limit,
        totalStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch top results' },
      { status: 500 }
    );
  }
}
