import React, { useState } from "react";
import { 
    Box, 
    Avatar, 
    Typography, 
    TextField, 
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import styles from "./SignUp.module.css";
import SelectInput from "../SelectInput/SelectInput";
import api from "../../api";
import { useAuth } from "../../AuthContext";
import { departments } from "../Dashboard/Doctor/doctorDepartments";
import { departmentSpecialities } from "../Dashboard/Doctor/departmentSpecialities";

const options = ["Patient", "Staff", "Doctor", "Admin"];
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export default function SignUp() {
    const { setLoader, setAlert, setAlertMsg, setAlertType } = useAuth();
    const navigate = useNavigate();
    
    // Form states
    const [user, setUser] = useState("Patient");
    const [department, setDepartment] = useState("");
    const [speciality, setSpeciality] = useState("");
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // Validation states
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle department change
    const handleDepartmentChange = (event) => {
        setDepartment(event.target.value);
        setSpeciality(""); // Reset speciality when department changes
        if (errors.speciality) {
            setErrors(prev => ({ ...prev, speciality: null }));
        }
    };

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        if (fname.trim().length < 2) {
            newErrors.fname = "First name must be at least 2 characters";
        }
        if (lname.trim().length < 2) {
            newErrors.lname = "Last name must be at least 2 characters";
        }
        if (!EMAIL_REGEX.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!PASSWORD_REGEX.test(password)) {
            newErrors.password = "Password must be at least 8 characters with uppercase, lowercase and number";
        }
        if (user === "Doctor") {
            if (!department) {
                newErrors.department = "Department is required";
            }
            if (!speciality) {
                newErrors.speciality = "Speciality is required";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        if (!validateForm()) {
            setAlertMsg("Please fix the errors in the form");
            setAlertType("error");
            setAlert(true);
            return;
        }

        setIsSubmitting(true);
        setLoader(true);

        const postData = {
            userType: user,
            fname: fname.trim(),
            lname: lname.trim(),
            ...(user === "Doctor" && { 
                department, 
                speciality 
            }),
            email: email.trim().toLowerCase(),
            password,
        };

        try {
            const response = await api.signup(postData);
            
            if (response.data.error) {
                setAlertMsg(response.data.errorMsg);
                setAlertType("error");
                setAlert(true);
            } else {
                // Reset form
                setUser("Patient");
                setDepartment("");
                setSpeciality("");
                setFname("");
                setLname("");
                setEmail("");
                setPassword("");
                setAlertMsg(response.data.msg || "Signup Successful!");
                setAlertType("success");
                setAlert(true);
                setTimeout(() => {
                    navigate("/signin");
                }, 1500);
            }
        } catch (error) {
            if (error.response?.status === 409) {
                setAlertMsg("This email is already registered");
            } else {
                setAlertMsg(error.response?.data?.errorMsg || "An error occurred during signup!");
            }
            setAlertType("error");
            setAlert(true);
        } finally {
            setLoader(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Box
                component="form"
                className={styles.form}
                noValidate
                onSubmit={handleSubmit}
            >
                <Avatar
                    alt="auth logo"
                    src="/authimg.png"
                    sx={{ width: 100, height: 100 }}
                />
                <Typography component="h1" variant="h5">
                    Sign Up
                </Typography>

                {/* User Type Field */}
                <SelectInput
                    label="User Type"
                    value={user}
                    setValue={setUser}
                    options={options}
                />

                {/* Doctor Fields */}
                {user === "Doctor" && (
                    <>
                        <FormControl fullWidth sx={{ marginBottom: "10px" }} error={!!errors.department}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={department}
                                onChange={handleDepartmentChange}
                                label="Department"
                            >
                                {departments
                                    .filter(dept => dept !== "All Departments")
                                    .map((dept) => (
                                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                    ))}
                            </Select>
                            {errors.department && (
                                <Typography color="error" variant="caption">{errors.department}</Typography>
                            )}
                        </FormControl>

                        <FormControl 
                            fullWidth 
                            sx={{ marginBottom: "10px" }} 
                            error={!!errors.speciality}
                            disabled={!department}
                        >
                            <InputLabel>Speciality</InputLabel>
                            <Select
                                value={speciality}
                                onChange={(e) => setSpeciality(e.target.value)}
                                label="Speciality"
                            >
                                {department && departmentSpecialities[department]?.map((spec) => (
                                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                                ))}
                            </Select>
                            {errors.speciality && (
                                <Typography color="error" variant="caption">{errors.speciality}</Typography>
                            )}
                        </FormControl>
                    </>
                )}

                {/* Name Fields */}
                <Box component="div" className={styles.nameContainer}>
                    <TextField
                        className={styles.nameInput}
                        autoComplete="given-name"
                        name="firstName"
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        value={fname}
                        autoFocus
                        onChange={(event) => setFname(event.target.value)}
                        error={!!errors.fname}
                        helperText={errors.fname}
                    />
                    <TextField
                        className={styles.nameInput}
                        autoComplete="family-name"
                        name="LastName"
                        required
                        fullWidth
                        id="LastName"
                        label="Last Name"
                        value={lname}
                        onChange={(event) => setLname(event.target.value)}
                        error={!!errors.lname}
                        helperText={errors.lname}
                    />
                </Box>

                {/* Email Field */}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    type="email"
                    label="Email Address"
                    name="email"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                />

                {/* Password Field */}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        "Sign Up"
                    )}
                </Button>

                <Link to="/signin" className={styles.linkBtn}>
                    {"Already have an account? Sign In"}
                </Link>
            </Box>
        </div>
    );
}