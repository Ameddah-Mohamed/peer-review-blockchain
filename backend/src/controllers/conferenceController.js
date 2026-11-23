const Conference = require("../models/Conference");

exports.getConferences = async (req, res, next) => {
  try {
    const conferences = await Conference.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      conferences: conferences.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        acronym: c.acronym,
        description: c.description,
        submissionDeadline: c.submissionDeadline,
        reviewDeadline: c.reviewDeadline,
        status: c.status,
        tracks: c.tracks,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.createConference = async (req, res, next) => {
  try {
    const { name, acronym, description, submissionDeadline, reviewDeadline, tracks } = req.body;

    if (!name || !acronym) {
      return res.status(400).json({
        success: false,
        message: "Conference name and acronym are required",
      });
    }

    const conf = new Conference({
      name: name.trim(),
      acronym: acronym.trim(),
      description: description ? description.trim() : undefined,
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
      reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
      tracks: Array.isArray(tracks) ? tracks : tracks ? [tracks] : undefined,
      createdBy: req.user._id,
    });

    await conf.save();

    res.status(201).json({
      success: true,
      message: "Conference created successfully",
      conference: {
        id: conf._id.toString(),
        name: conf.name,
        acronym: conf.acronym,
        status: conf.status,
        tracks: conf.tracks,
      },
    });
  } catch (error) {
    next(error);
  }
};
