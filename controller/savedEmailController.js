import SavedEmailTemplate from '../model/savedEmailTemplate.js'

export const saveTemplate = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' })

    const { role = 'software engineer', subject = '', body } = req.body || {}
    if (!body) return res.status(400).json({ success: false, message: 'Template body is required' })

    const doc = new SavedEmailTemplate({ user: user._id, role, subject, body })
    await doc.save()
    return res.json({ success: true, template: doc })
  } catch (err) {
    console.error('saveTemplate', err)
    return res.status(500).json({ success: false, message: err.message || String(err) })
  }
}

export const listTemplates = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' })

    const templates = await SavedEmailTemplate.find({ user: user._id }).sort({ createdAt: -1 })
    return res.json({ success: true, templates })
  } catch (err) {
    console.error('listTemplates', err)
    return res.status(500).json({ success: false, message: err.message || String(err) })
  }
}
