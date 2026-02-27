import Candidate from '../models/Candidate.js';
import xlsx from 'xlsx';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// @desc    Test endpoint
// @route   GET /api/candidates/test
// @access  Public
export const testEndpoint = async (req, res) => {
    res.json({ success: true, message: 'Candidate API is working!' });
};

// @desc    Upload candidates from Excel file
// @route   POST /api/candidates/upload
// @access  Private (Examiner only)
export const uploadExcelFile = async (req, res) => {
    try {
        console.log('=== Upload Request Received ===');
        console.log('File:', req.file ? req.file.originalname : 'No file');
        console.log('Body:', req.body);

        if (!req.file) {
            console.log('ERROR: No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'Please upload an Excel file',
                formatError: false
            });
        }

        // Validate file extension
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = req.file.originalname.toLowerCase();
        const fileExt = fileName.substring(fileName.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                formatError: true,
                message: '❌ Wrong Format! Only .xlsx, .xls, or .csv files are allowed.',
                expectedFormat: {
                    columns: ['name', 'mobileNumber', 'email (optional)'],
                    example: [
                        { name: 'Rahul Kumar', mobileNumber: '9876543210', email: 'rahul@example.com' },
                        { name: 'Priya Sharma', mobileNumber: '9876543211', email: 'priya@example.com' }
                    ]
                }
            });
        }

        const { examId } = req.body;
        if (!examId) {
            console.log('ERROR: No examId provided');
            return res.status(400).json({
                success: false,
                message: 'Please provide examId',
                formatError: false
            });
        }

        console.log('Reading Excel file...');
        let workbook;
        try {
            workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                formatError: true,
                message: '❌ Wrong Format! Unable to read the file. Please upload a valid Excel (.xlsx/.xls) or CSV file.',
                expectedFormat: {
                    columns: ['name', 'mobileNumber', 'email (optional)'],
                    example: [
                        { name: 'Rahul Kumar', mobileNumber: '9876543210', email: 'rahul@example.com' },
                        { name: 'Priya Sharma', mobileNumber: '9876543211', email: 'priya@example.com' }
                    ]
                }
            });
        }

        const sheetName = workbook.SheetNames[0];
        console.log('Sheet name:', sheetName);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log('Number of rows:', data.length);

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                formatError: true,
                message: '❌ Wrong Format! Excel file is empty or has no data rows. Please add candidate data with proper column headers.',
                expectedFormat: {
                    columns: ['name', 'mobileNumber', 'email (optional)'],
                    example: [
                        { name: 'Rahul Kumar', mobileNumber: '9876543210', email: 'rahul@example.com' },
                        { name: 'Priya Sharma', mobileNumber: '9876543211', email: 'priya@example.com' }
                    ]
                }
            });
        }

        // ===== FORMAT VALIDATION =====
        // Check if the first row has the required columns
        const firstRow = data[0];
        const columnKeys = Object.keys(firstRow).map(k => k.trim().toLowerCase());
        console.log('Detected columns:', columnKeys);

        // Check for "name" column (required)
        const nameVariants = ['name', 'Name', 'NAME', 'full name', 'Full Name', 'fullname', 'FullName'];
        const hasName = Object.keys(firstRow).some(k => nameVariants.includes(k.trim()));

        // Check for "mobileNumber" / "mobile" column (required)
        const mobileVariants = ['mobileNumber', 'MobileNumber', 'mobilenumber', 'mobile', 'Mobile', 'MOBILE', 'Mobile Number', 'mobile number', 'phone', 'Phone', 'PHONE', 'Phone Number', 'phone number'];
        const hasMobile = Object.keys(firstRow).some(k => mobileVariants.includes(k.trim()));

        if (!hasName || !hasMobile) {
            const missingCols = [];
            if (!hasName) missingCols.push('name');
            if (!hasMobile) missingCols.push('mobileNumber');

            return res.status(400).json({
                success: false,
                formatError: true,
                message: `❌ Wrong Format! Missing required column(s): ${missingCols.join(', ')}. Your file has columns: [${Object.keys(firstRow).join(', ')}]`,
                missingColumns: missingCols,
                detectedColumns: Object.keys(firstRow),
                expectedFormat: {
                    columns: ['name', 'mobileNumber', 'email (optional)'],
                    example: [
                        { name: 'Rahul Kumar', mobileNumber: '9876543210', email: 'rahul@example.com' },
                        { name: 'Priya Sharma', mobileNumber: '9876543211', email: 'priya@example.com' }
                    ]
                }
            });
        }

        // Validate each row and collect errors
        const validCandidates = [];
        const rowErrors = [];

        data.forEach((row, index) => {
            const name = row.name || row.Name || row.NAME || row['full name'] || row['Full Name'] || row.fullname || row.FullName;
            const mobile = row.mobileNumber || row.MobileNumber || row.mobilenumber || row.mobile || row.Mobile || row.MOBILE || row['Mobile Number'] || row['mobile number'] || row.phone || row.Phone || row.PHONE || row['Phone Number'] || row['phone number'];

            if (!name || String(name).trim() === '') {
                rowErrors.push(`Row ${index + 2}: Name is empty`);
                return;
            }
            if (!mobile || String(mobile).trim() === '') {
                rowErrors.push(`Row ${index + 2}: Mobile number is empty`);
                return;
            }

            // Generate unique candidate ID and password
            const candidateId = `CAND${examId.slice(-4)}${String(validCandidates.length + 1).padStart(4, '0')}`;
            const password = Math.random().toString(36).slice(-8).toUpperCase();

            const candidate = {
                name: String(name).trim(),
                mobileNumber: String(mobile).trim(),
                candidateId,
                password,
                examId
            };

            // Only add email if it exists
            const email = row.email || row.Email || row.EMAIL || row.gmail || row.Gmail;
            if (email && String(email).trim() !== '') {
                candidate.email = String(email).trim();
            }

            validCandidates.push(candidate);
        });

        if (validCandidates.length === 0) {
            return res.status(400).json({
                success: false,
                formatError: true,
                message: '❌ Wrong Format! No valid candidates found. All rows have missing name or mobile number.',
                rowErrors,
                expectedFormat: {
                    columns: ['name', 'mobileNumber', 'email (optional)'],
                    example: [
                        { name: 'Rahul Kumar', mobileNumber: '9876543210', email: 'rahul@example.com' },
                        { name: 'Priya Sharma', mobileNumber: '9876543211', email: 'priya@example.com' }
                    ]
                }
            });
        }

        try {
            const result = await Candidate.insertMany(validCandidates, { ordered: false });
            console.log('✅ Saved to DB:', result.length, 'candidates');

            const response = {
                success: true,
                count: result.length,
                message: `Successfully uploaded ${result.length} candidates`,
                data: result
            };

            // If some rows had errors, include them as warnings
            if (rowErrors.length > 0) {
                response.warnings = rowErrors;
                response.message = `Uploaded ${result.length} candidates (${rowErrors.length} rows skipped due to missing data)`;
            }

            res.status(201).json(response);
        } catch (insertError) {
            console.error('❌ Insert error:', insertError);

            if (insertError.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed: ' + insertError.message,
                    errors: insertError.errors
                });
            }

            if (insertError.insertedDocs && insertError.insertedDocs.length > 0) {
                return res.status(201).json({
                    success: true,
                    count: insertError.insertedDocs.length,
                    message: `Partially uploaded ${insertError.insertedDocs.length} candidates`,
                    data: insertError.insertedDocs
                });
            }

            throw insertError;
        }
    } catch (error) {
        console.error('❌ Upload error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Some candidates already exist for this exam'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload candidates in bulk
// @route   POST /api/candidates/bulk
// @access  Private (Examiner only)
export const bulkUploadCandidates = async (req, res) => {
    try {
        const { examId, candidates } = req.body;

        if (!examId || !candidates || !Array.isArray(candidates)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide examId and candidates array'
            });
        }

        const candidateData = candidates.map((candidate, index) => {
            const candidateId = `CAND${examId.slice(-4)}${String(index + 1).padStart(4, '0')}`;
            const password = Math.random().toString(36).slice(-8).toUpperCase();
            return {
                ...candidate,
                candidateId,
                password,
                examId
            };
        });

        const result = await Candidate.insertMany(candidateData, { ordered: false });

        res.status(201).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Some candidates already exist for this exam'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all candidates for an exam
// @route   GET /api/candidates/:examId
// @access  Private
export const getCandidatesByExam = async (req, res) => {
    try {
        const candidates = await Candidate.find({ examId: req.params.examId });

        res.status(200).json({
            success: true,
            count: candidates.length,
            data: candidates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add candidate manually
// @route   POST /api/candidates/manual
// @access  Private (Examiner only)
export const addManualCandidate = async (req, res) => {
    try {
        const { name, email, phone, candidateId, examId, password: customPassword } = req.body;

        if (!name || !email || !examId) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and examId are required'
            });
        }

        const generatedId = candidateId || `CAND${examId.slice(-4)}${Date.now().toString().slice(-4)}`;
        const password = customPassword || Math.random().toString(36).slice(-8).toUpperCase();

        const candidate = await Candidate.create({
            name,
            email,
            mobileNumber: phone || '',
            candidateId: generatedId,
            password,
            examId
        });

        res.status(201).json({
            success: true,
            data: candidate
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Candidate with this email or ID already exists for this exam'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Examiner only)
export const updateCandidate = async (req, res) => {
    try {
        const { name, email, mobileNumber } = req.body;
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { name, email, mobileNumber },
            { new: true, runValidators: true }
        );

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: candidate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Examiner only)
export const deleteCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Candidate deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
