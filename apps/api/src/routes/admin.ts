import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticateJwt } from "../middleware/auth";
import { adminTypes, courseTypes } from "types";
import Cookies from "cookies";
import { prisma } from "../index";
export const router = express.Router();
require("source-map-support").install();
// @ts-ignore
// const secret: string = process.env.SECRET;
console.log(process.env.SECRET);
const secret = "SECr3t";
router.get("/me", authenticateJwt, async (req: Request, res: Response) => {
  if (typeof req.headers["admin"] === "string") {
    const username: string = req.headers["admin"];
    try {
      const admin = await prisma.admin.findUnique({ where: { username } });
      if (admin) {
        res.json({ username: admin.username });
      } else {
        res.status(403).json({ message: "Admin dose not exists" });
      }
    } catch (e) {
      console.log(e);
      res.status(404).json({ message: "db error" });
    }
  } else {
    res.status(404).json({ message: "Admin dose not exists" });
  }
});

router.post("/signup", async (req: Request, res: Response) => {
  const parsedInput = adminTypes.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(411).json({ error: parsedInput.error });
  }
  const { username, password } = parsedInput.data;
  try {
    const admin = await prisma.admin.findUnique({
      where: { username, password },
    });
    if (admin) {
      res.status(403).json({ message: "Admin already exists" });
    } else {
      const newAdmin = await prisma.admin.create({
        data: { username, password },
      });
      if (newAdmin) {
        const token = jwt.sign({ username, role: "admin" }, secret, {
          expiresIn: "1h",
        });
        const cookie = new Cookies(req, res);
        cookie.set("admin-token", token);
        res.json({ message: "Admin created successfuly", token });
      } else {
        res.status(404).json({ message: "db error" });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(404).json({ message: "db error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsedInput = adminTypes.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(411).json({ error: parsedInput.error });
  }
  const { username, password } = parsedInput.data;
  try {
    const admin = await prisma.admin.findUnique({
      where: { username, password },
    });
    if (admin) {
      const cookie = new Cookies(req, res);
      const token: string = jwt.sign({ username, role: "admin" }, secret, {
        expiresIn: "1h",
      });
      cookie.set("admin-token", token);
      res.json({ message: "Admin logged In", token });
    } else {
      res.status(403).json({ message: "Admin dose not exists" });
    }
  } catch (e) {
    console.log(e);
    res.status(404).json({ message: "db error" });
  }
});

router.post(
  "/courses",
  authenticateJwt,
  async (req: Request, res: Response) => {
    console.log("hit");
    const parsedInput = courseTypes.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(411).json({ error: parsedInput.error });
    }
    const courseData = parsedInput.data;
    if (typeof req.headers["admin"] === "string") {
      const username: string = req.headers["admin"];
      try {
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (admin) {
          const course = await prisma.course.findUnique({
            where: { title: courseData.title },
          });
          if (course) {
            res.status(403).json({ message: "Course already exists" });
          } else {
            const newCourse = await prisma.course.create({
              data: {
                creatorId: admin.id,
                ...courseData,
              },
            });
            res.json({
              message: "Course created successfully",
              courseId: newCourse.id,
            });
          }
        } else {
          res.status(403).json({ message: "Admin dose not exists" });
        }
      } catch (e) {
        console.log(e);
        res.status(404).json({ message: "db error" });
      }
    } else {
      res.status(404).json({ message: "Admin dose not exists" });
    }
  }
);
// update course
router.put(
  "/courses/:courseId",
  authenticateJwt,
  async (req: Request, res: Response) => {
    const parsedInput = courseTypes.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(411).json({ error: parsedInput.error });
    }
    // const temp =
    const courseId = parseInt(req.params.courseId);
    const courseData = parsedInput.data;
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (course) {
        const updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: { creatorId: course.creatorId, ...courseData },
        });
        if (updatedCourse) {
          res.json({ message: "Course updated successfully" });
        } else {
          res.status(403).json({ message: "Course not found" });
        }
      } else {
        res.status(403).json({ message: "Course not found" });
      }
    } catch (e) {
      console.log(e);
      res.status(403).json({ message: "db error" });
    }
  }
);
// all the courses
router.get("/courses", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({});
    res.json({ courses });
  } catch (e) {
    console.log(e);
    res.status(404).json({ message: "db error" });
  }
});

// courses from logged in admin
router.get(
  "/courses/me",
  authenticateJwt,
  async (req: Request, res: Response) => {
    if (typeof req.headers["admin"] === "string") {
      const username: string = req.headers["admin"];
      try {
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (admin) {
          const courses = await prisma.course.findMany({
            where: {
              creatorId: admin.id,
            },
          });
          res.json({ courses });
        } else {
          res.status(403).json({ message: "Admin dose not exists" });
        }
      } catch (e) {
        console.log(e);
        res.status(403).json({ message: "db error" });
      }
    } else {
      res.status(403).json({ message: "Admin dose not exists" });
    }
  }
);

// route for getting particular course
router.get(
  "/courses/:courseId",
  authenticateJwt,
  async (req: Request, res: Response) => {
    const courseId: number = parseInt(req.params.courseId);
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (course) {
        res.status(200).json({ course });
      } else {
        res.status(403).json({ message: "Course not found" });
      }
    } catch (e) {
      res.status(404).json({ message: "db error" });
    }
  }
);


