import { useEffect, useState } from "react";
import { ApiError, fetchClassroomCourses, type ClassroomCourse } from "../lib/api";

export type ClassroomStatus = "loading" | "not_connected" | "ready" | "error";

export function useClassroomCourses() {
  const [status, setStatus] = useState<ClassroomStatus>("loading");
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);

  useEffect(() => {
    fetchClassroomCourses()
      .then((data) => {
        setCourses(data);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus(err instanceof ApiError && err.status === 409 ? "not_connected" : "error");
      });
  }, []);

  return { status, courses };
}
