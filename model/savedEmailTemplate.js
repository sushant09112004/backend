import mongoose from 'mongoose'

const savedEmailTemplateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'software engineer' },
  subject: { type: String, default: '' },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const SavedEmailTemplate = mongoose.model('SavedEmailTemplate', savedEmailTemplateSchema)

export default SavedEmailTemplate
