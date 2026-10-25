"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Select,
} from "@/components/admin/ui";
import {
  apiGet,
  apiPatch,
  apiPost,
  ApiError,
} from "@/lib/admin/client";
import type {
  Address,
  Batch,
  Course,
  ItemResponse,
  Lead,
  ListResponse,
  Payment,
  Profile,
  Registration,
  Role,
  User,
} from "@/lib/admin/types";

type RouteParams = { id: string };

function cleanCodeSegment(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return cleaned || fallback;
}

export function buildRegistrationNumber(batchName: string, profileName: string): string {
  const cleanBatch = cleanCodeSegment(batchName, "BATCH");
  const cleanProfile = cleanCodeSegment(profileName, "STUDENT");
  return `REG_${cleanBatch}_${cleanProfile}`;
}

export default function LeadRegistrationPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id: leadId } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  // Active step: 1 (User), 2 (Profile & Address), 3 (Registration), 4 (Payment), 5 (Completed)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Entities created during wizard
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);
  const [createdAddress, setCreatedAddress] = useState<Address | null>(null);
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);

  // Step 4 Form: Registration Payment
  const [paymentForm, setPaymentForm] = useState({
    rupees: "",
    paymentMethod: "upi",
    paymentProof: "",
    isVerified: true,
  });

  // Inline payment on completion screen toggle & form
  const [showCompletePaymentForm, setShowCompletePaymentForm] = useState(false);

  // Step 1 Form: User Creation
  const [userForm, setUserForm] = useState({
    username: "",
    roleId: "",
  });

  // Step 2 Form: Profile & Address
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Step 3 Form: Course & Batch Registration
  const [regForm, setRegForm] = useState({
    courseId: "",
    batchId: "",
    registrationNo: "",
    isCustomRegNo: false,
  });

  // Inline batch creation toggle
  const [newBatchName, setNewBatchName] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [showNewBatchInput, setShowNewBatchInput] = useState(false);

  // Load initial data: Lead, Roles, Courses, Batches
  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [leadRes, rolesRes, coursesRes, batchesRes] = await Promise.all([
        apiGet<ItemResponse<Lead>>(`/api/leads/${leadId}`),
        apiGet<ListResponse<Role>>("/api/roles"),
        apiGet<ListResponse<Course>>("/api/courses"),
        apiGet<ListResponse<Batch>>("/api/batches"),
      ]);

      const leadData = leadRes.data;
      setLead(leadData);
      setRoles(rolesRes.data);
      setCourses(coursesRes.data);
      setBatches(batchesRes.data);

      // Pre-fill Step 1
      setUserForm({
        username: leadData.username,
        roleId: rolesRes.data.length > 0 ? rolesRes.data[0].id : "",
      });

      // Pre-fill Step 2
      const fullName = `${leadData.firstName} ${leadData.lastName ?? ""}`.trim();
      setProfileForm((prev) => ({
        ...prev,
        name: fullName,
      }));

      // Pre-fill Step 3 Course
      setRegForm((prev) => ({
        ...prev,
        courseId: leadData.courseId ?? (coursesRes.data.length > 0 ? coursesRes.data[0].id : ""),
        batchId: batchesRes.data.length > 0 ? batchesRes.data[0].id : "",
      }));

      // Look up existing user, profile, address, and registration if already created
      try {
        const userRes = await apiGet<ListResponse<User>>(
          `/api/users?username=${encodeURIComponent(leadData.username)}`
        );
        if (userRes.data && userRes.data.length > 0) {
          const u = userRes.data[0];
          setCreatedUser(u);
          if (u.profile) {
            setCreatedProfile(u.profile);
            setProfileForm((prev) => ({
              ...prev,
              name: u.profile?.name || prev.name,
              email: u.profile?.email || prev.email,
            }));
            if (u.profile.addresses && u.profile.addresses.length > 0) {
              const a = u.profile.addresses[0];
              setCreatedAddress(a);
              setProfileForm((prev) => ({
                ...prev,
                addressLine: a.addressLine || prev.addressLine,
                city: a.city || prev.city,
                state: a.state || prev.state,
                pincode: a.pincode || prev.pincode,
                country: a.country || prev.country,
              }));
            }
            // Check if student profile already has a registration
            const regRes = await apiGet<ListResponse<Registration>>(
              `/api/registrations?profileId=${u.profile.id}`
            );
            if (regRes.data && regRes.data.length > 0) {
              const r = regRes.data[0];
              setCompletedRegistration(r);
              setRegForm((prev) => ({
                ...prev,
                courseId: r.courseId,
                batchId: r.batchId || "",
                registrationNo: r.registrationNo,
                isCustomRegNo: true,
              }));
            }
          }
        }
      } catch {
        // Non-blocking lookup
      }
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Failed to load lead details",
      });
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Dynamically update registration number when batch or profile name changes (unless user typed a custom one)
  useEffect(() => {
    if (!regForm.isCustomRegNo) {
      const selectedBatch = batches.find((b) => b.id === regForm.batchId);
      const batchName = selectedBatch ? selectedBatch.name : "BATCH";
      const profileName = profileForm.name || "STUDENT";
      const autoRegNo = buildRegistrationNumber(batchName, profileName);
      setRegForm((prev) => ({ ...prev, registrationNo: autoRegNo }));
    }
  }, [regForm.batchId, profileForm.name, batches, regForm.isCustomRegNo]);

  // Helper to create a batch on the fly
  async function handleCreateNewBatch() {
    if (!newBatchName.trim()) return;
    setCreatingBatch(true);
    try {
      const res = await apiPost<ItemResponse<Batch>>("/api/batches", {
        name: newBatchName.trim(),
      });
      const created = res.data;
      setBatches((prev) => [created, ...prev]);
      setRegForm((prev) => ({ ...prev, batchId: created.id }));
      setNewBatchName("");
      setShowNewBatchInput(false);
      setMessage({ tone: "success", text: `Batch "${created.name}" created.` });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Failed to create batch",
      });
    } finally {
      setCreatingBatch(false);
    }
  }

  // --- STEP 1: Handle User Account Creation ---
  async function handleStep1Submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const username = userForm.username.trim();
    if (!username) {
      setMessage({ tone: "error", text: "Username is required." });
      setSubmitting(false);
      return;
    }

    try {
      let user: User;
      try {
        const createRes = await apiPost<ItemResponse<User>>("/api/users", {
          username,
          roleId: userForm.roleId || null,
          status: "active",
        });
        user = createRes.data;
        setMessage({ tone: "success", text: `User @${user.username} created.` });
      } catch (err) {
        // If 409 (username already exists), look up the existing user
        if (err instanceof ApiError && err.status === 409) {
          const listRes = await apiGet<ListResponse<User>>(`/api/users?username=${encodeURIComponent(username)}`);
          if (listRes.data && listRes.data.length > 0) {
            user = listRes.data[0];
            setMessage({
              tone: "success",
              text: `Existing user @${user.username} found. Proceeding with this user.`,
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      setCreatedUser(user);
      if (user.profile) {
        setCreatedProfile(user.profile);
        setProfileForm((prev) => ({
          ...prev,
          name: user.profile?.name || prev.name,
          email: user.profile?.email || prev.email,
        }));
        if (user.profile.addresses && user.profile.addresses.length > 0) {
          const firstAddr = user.profile.addresses[0];
          setCreatedAddress(firstAddr);
          setProfileForm((prev) => ({
            ...prev,
            addressLine: firstAddr.addressLine || prev.addressLine,
            city: firstAddr.city || prev.city,
            state: firstAddr.state || prev.state,
            pincode: firstAddr.pincode || prev.pincode,
            country: firstAddr.country || prev.country,
          }));
        }
      }
      setStep(2);
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "User creation failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // --- STEP 2: Handle Profile & Address Creation ---
  async function handleStep2Submit(event: React.FormEvent) {
    event.preventDefault();
    if (!createdUser) {
      setMessage({ tone: "error", text: "User account missing. Return to step 1." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { name, email, addressLine, city, state, pincode, country } = profileForm;

    if (!name.trim() || !email.trim()) {
      setMessage({ tone: "error", text: "Full name and email are required." });
      setSubmitting(false);
      return;
    }

    if (!addressLine.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setMessage({ tone: "error", text: "All address fields are required." });
      setSubmitting(false);
      return;
    }

    try {
      const profileRes = await apiPost<ItemResponse<Profile>>("/api/profiles", {
        userId: createdUser.id,
        name: name.trim(),
        email: email.trim(),
        status: "active",
      });
      const profile = profileRes.data;

      // Upsert Address: Update existing if already created or existing on profile, else create
      const existingAddrId =
        createdAddress?.id ||
        (profile.addresses && profile.addresses.length > 0 ? profile.addresses[0].id : null);

      let savedAddress: Address;
      if (existingAddrId) {
        const addrRes = await apiPatch<ItemResponse<Address>>(`/api/addresses/${existingAddrId}`, {
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim() || "India",
        });
        savedAddress = addrRes.data;
      } else {
        const addrRes = await apiPost<ItemResponse<Address>>("/api/addresses", {
          profileId: profile.id,
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim() || "India",
        });
        savedAddress = addrRes.data;
      }

      setCreatedProfile(profile);
      setCreatedAddress(savedAddress);
      setMessage({ tone: "success", text: "Profile and address saved." });
      setStep(3);
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Profile & address save failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // --- STEP 3: Handle Course & Batch Registration ---
  async function handleStep3Submit(event: React.FormEvent) {
    event.preventDefault();
    if (!createdProfile) {
      setMessage({ tone: "error", text: "Profile missing. Return to step 2." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { courseId, batchId, registrationNo } = regForm;

    if (!courseId) {
      setMessage({ tone: "error", text: "Please select a course." });
      setSubmitting(false);
      return;
    }

    if (!registrationNo.trim()) {
      setMessage({ tone: "error", text: "Registration number cannot be empty." });
      setSubmitting(false);
      return;
    }

    try {
      let reg: Registration;
      if (completedRegistration) {
        // If registration was already created, update it
        const updateRes = await apiPatch<ItemResponse<Registration>>(
          `/api/registrations/${completedRegistration.id}`,
          {
            courseId,
            batchId: batchId || null,
            registrationNo: registrationNo.trim(),
          }
        );
        reg = updateRes.data;
      } else {
        try {
          const regRes = await apiPost<ItemResponse<Registration>>("/api/registrations", {
            courseId,
            batchId: batchId || null,
            profileId: createdProfile.id,
            registrationNo: registrationNo.trim(),
          });
          reg = regRes.data;
        } catch (postErr) {
          if (postErr instanceof ApiError && postErr.status === 409) {
            // Check if this registration belongs to the current student
            const findRes = await apiGet<ListResponse<Registration>>(
              `/api/registrations?registrationNo=${encodeURIComponent(registrationNo.trim())}`
            );
            if (
              findRes.data &&
              findRes.data.length > 0 &&
              findRes.data[0].profileId === createdProfile.id
            ) {
              reg = findRes.data[0];
            } else {
              throw postErr;
            }
          } else {
            throw postErr;
          }
        }
      }

      setCompletedRegistration(reg);

      // Automatically mark lead as converted and log a remark
      try {
        await apiPatch(`/api/leads/${leadId}`, {
          status: "converted",
          hasBeenCalled: true,
        });
        await apiPost(`/api/leads/${leadId}/remarks`, {
          remark: `Lead converted to student. Registration No: ${reg.registrationNo}`,
        });
      } catch {
        // Non-blocking if lead remark update fails
      }

      // Pre-fill payment amount from selected course if not yet entered
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        const fee = course.discountedPrice ?? course.originalPrice;
        if (fee) {
          setPaymentForm((prev) => ({
            ...prev,
            rupees: prev.rupees || String(fee),
          }));
        }
      }

      setMessage({
        tone: "success",
        text: "Registration confirmed! Proceeding to payment step.",
      });
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          const findRes = await apiGet<ListResponse<Registration>>(
            `/api/registrations?registrationNo=${encodeURIComponent(registrationNo.trim())}`
          );
          if (findRes.data && findRes.data.length > 0) {
            const existingReg = findRes.data[0];
            setCompletedRegistration(existingReg);
            if (selectedCourse && !paymentForm.rupees) {
              const fee = selectedCourse.discountedPrice ?? selectedCourse.originalPrice;
              if (fee) setPaymentForm((prev) => ({ ...prev, rupees: String(fee) }));
            }
            setMessage({
              tone: "success",
              text: `Registration "${existingReg.registrationNo}" already exists. Proceeding directly to Payment Step.`,
            });
            setStep(4);
            return;
          }
        } catch {}
        const uniqueSuffix = `_${Date.now().toString(36).slice(-3).toUpperCase()}`;
        const newNo = `${registrationNo.trim()}${uniqueSuffix}`;
        setRegForm((prev) => ({ ...prev, registrationNo: newNo, isCustomRegNo: true }));
        setMessage({
          tone: "error",
          text: `Registration number "${registrationNo.trim()}" is already assigned to another student. Suggested updated number: "${newNo}" — please click Submit again, or click "Proceed to Payment Step" below.`,
        });
      } else {
        setMessage({
          tone: "error",
          text: err instanceof ApiError ? err.message : "Registration failed.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // --- STEP 4: Handle Registration Payment ---
  async function handleStep4Submit(event: React.FormEvent) {
    event.preventDefault();
    if (!createdProfile) {
      setMessage({ tone: "error", text: "Student profile missing. Return to step 2." });
      return;
    }

    let reg = completedRegistration;
    if (!reg) {
      try {
        const findRes = await apiGet<ListResponse<Registration>>(
          `/api/registrations?registrationNo=${encodeURIComponent(regForm.registrationNo.trim())}`
        );
        if (findRes.data && findRes.data.length > 0) {
          reg = findRes.data[0];
          setCompletedRegistration(reg);
        }
      } catch {}
    }

    const rupeesVal = parseFloat(paymentForm.rupees);
    if (isNaN(rupeesVal) || rupeesVal < 0) {
      setMessage({ tone: "error", text: "Please enter a valid non-negative payment amount." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payRes = await apiPost<ItemResponse<Payment>>("/api/payments", {
        profileId: createdProfile.id,
        registrationId: reg?.id ?? null,
        rupees: rupeesVal,
        paymentMethod: paymentForm.paymentMethod,
        paymentProof: paymentForm.paymentProof.trim() || null,
        isVerified: paymentForm.isVerified,
      });

      setCreatedPayment(payRes.data);
      setMessage({
        tone: "success",
        text: `Payment of ₹${rupeesVal.toLocaleString("en-IN")} recorded successfully!`,
      });
      setStep(5);
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Payment recording failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipPayment() {
    setMessage({
      tone: "success",
      text: "Registration completed. Payment marked as pending.",
    });
    setStep(5);
  }

  // Record payment from the completion screen (if skipped earlier)
  async function handleCompleteRecordPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!createdProfile || !completedRegistration) return;

    const rupeesVal = parseFloat(paymentForm.rupees);
    if (isNaN(rupeesVal) || rupeesVal < 0) {
      setMessage({ tone: "error", text: "Please enter a valid non-negative payment amount." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payRes = await apiPost<ItemResponse<Payment>>("/api/payments", {
        profileId: createdProfile.id,
        registrationId: completedRegistration.id,
        rupees: rupeesVal,
        paymentMethod: paymentForm.paymentMethod,
        paymentProof: paymentForm.paymentProof.trim() || null,
        isVerified: paymentForm.isVerified,
      });

      setCreatedPayment(payRes.data);
      setShowCompletePaymentForm(false);
      setMessage({
        tone: "success",
        text: `Payment of ₹${rupeesVal.toLocaleString("en-IN")} recorded successfully!`,
      });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Payment recording failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Lead Registration" description="Loading lead details…">
        <div className="py-12 text-center text-sm text-zinc-500">
          Loading lead registration wizard…
        </div>
      </AdminShell>
    );
  }

  if (!lead) {
    return (
      <AdminShell title="Lead Registration">
        <Alert tone="error">Lead not found or could not be loaded.</Alert>
        <div className="mt-4">
          <Link
            href="/manage/leads"
            className="inline-flex items-center text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to Leads
          </Link>
        </div>
      </AdminShell>
    );
  }

  const selectedCourse = courses.find((c) => c.id === regForm.courseId);
  const selectedBatch = batches.find((b) => b.id === regForm.batchId);

  return (
    <AdminShell
      title="Lead Registration"
      description="Convert this prospective lead into an enrolled registered student."
    >
      {/* Top Banner: Lead Details */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Lead Candidate
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  lead.status === "converted"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {lead.status}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {lead.firstName} {lead.lastName ?? ""}
            </h2>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                <strong>Username / Phone:</strong> {lead.username}
              </span>
              {lead.course ? (
                <span>
                  <strong>Interested Course:</strong> {lead.course.name}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href="/manage/leads"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← Back to Leads
          </Link>
        </div>
      </div>

      {/* Step Progress Stepper */}
      <nav className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {[
          { num: 1, label: "User Account" },
          { num: 2, label: "Profile & Address" },
          { num: 3, label: "Registration" },
          { num: 4, label: "Payment" },
          { num: 5, label: "Complete" },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                // Pre-fill payment amount if moving to step 4
                if (s.num === 4 && selectedCourse && !paymentForm.rupees) {
                  const fee = selectedCourse.discountedPrice ?? selectedCourse.originalPrice;
                  if (fee) setPaymentForm((prev) => ({ ...prev, rupees: String(fee) }));
                }
                setStep(s.num as 1 | 2 | 3 | 4 | 5);
              }}
              className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-left transition cursor-pointer ${
                isActive
                  ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : isDone
                  ? "border-emerald-300 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100/50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {isDone ? "✓" : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* ================= STEP 1: USER CREATION ================= */}
      {step === 1 && (
        <Card title="Step 1: Create User Account">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleStep1Submit}>
            <Field
              label="Username"
              hint="Pre-filled from lead contact/phone. Used for student login credentials."
            >
              <Input
                required
                value={userForm.username}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="e.g. 9876543210"
              />
            </Field>

            <Field
              label="User Role"
              hint="Assign system permissions (e.g. Student, User)."
            >
              <Select
                value={userForm.roleId}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, roleId: e.target.value }))
                }
              >
                <option value="">No role / Default</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center gap-3 pt-3 md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating User…" : "Next: Profile & Address →"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= STEP 2: PROFILE & ADDRESS ================= */}
      {step === 2 && (
        <Card
          title="Step 2: Student Profile & Address"
          action={
            <div className="text-xs text-zinc-500">
              User: <span className="font-semibold text-zinc-800 dark:text-zinc-200">@{createdUser?.username}</span>
            </div>
          }
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleStep2Submit}>
            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Personal Information
              </h3>
            </div>

            <Field label="Full Name" hint="Pre-filled from lead name.">
              <Input
                required
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Aarav Sharma"
              />
            </Field>

            <Field label="Email Address" hint="Student contact email for notifications.">
              <Input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="e.g. student@example.com"
              />
            </Field>

            <div className="md:col-span-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Address Details
              </h3>
            </div>

            <div className="md:col-span-2">
              <Field label="Address Line" hint="House / Apartment / Street">
                <Input
                  required
                  value={profileForm.addressLine}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      addressLine: e.target.value,
                    }))
                  }
                  placeholder="e.g. 102, Shivalik Residency, Ring Road"
                />
              </Field>
            </div>

            <Field label="City">
              <Input
                required
                value={profileForm.city}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="e.g. Ahmedabad"
              />
            </Field>

            <Field label="State">
              <Input
                required
                value={profileForm.state}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, state: e.target.value }))
                }
                placeholder="e.g. Gujarat"
              />
            </Field>

            <Field label="Pincode / Postal Code">
              <Input
                required
                value={profileForm.pincode}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, pincode: e.target.value }))
                }
                placeholder="e.g. 380015"
              />
            </Field>

            <Field label="Country">
              <Input
                required
                value={profileForm.country}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, country: e.target.value }))
                }
                placeholder="e.g. India"
              />
            </Field>

            <div className="flex items-center gap-3 pt-3 md:col-span-2">
              <Button variant="secondary" onClick={() => setStep(1)} type="button">
                ← Back to User
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving Profile…" : "Next: Course & Batch Registration →"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= STEP 3: REGISTRATION ================= */}
      {step === 3 && (
        <Card
          title="Step 3: Course & Batch Registration"
          action={
            <div className="text-xs text-zinc-500">
              Student: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{createdProfile?.name}</span>
            </div>
          }
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleStep3Submit}>
            <Field label="Select Course" hint="Course the student is registering for.">
              <Select
                required
                value={regForm.courseId}
                onChange={(e) =>
                  setRegForm((prev) => ({ ...prev, courseId: e.target.value }))
                }
              >
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.duration ? `(${c.duration})` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Select Batch"
              hint="Cohort/batch for scheduled live classes."
            >
              <div className="space-y-2">
                <Select
                  value={regForm.batchId}
                  onChange={(e) =>
                    setRegForm((prev) => ({
                      ...prev,
                      batchId: e.target.value,
                    }))
                  }
                >
                  <option value="">No batch assigned yet</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>

                {showNewBatchInput ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="New batch name, e.g. Batch 2026-A"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                    />
                    <Button
                      onClick={() => void handleCreateNewBatch()}
                      disabled={creatingBatch || !newBatchName.trim()}
                      className="shrink-0"
                    >
                      {creatingBatch ? "Adding…" : "Add"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowNewBatchInput(false);
                        setNewBatchName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewBatchInput(true)}
                    className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    + Create new batch cohort
                  </button>
                )}
              </div>
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Registration Number"
                hint="Auto-generated using the formula: REG_BATCHNAME_PROFILENAME. You can edit this freely."
              >
                <div className="relative">
                  <Input
                    required
                    value={regForm.registrationNo}
                    onChange={(e) =>
                      setRegForm((prev) => ({
                        ...prev,
                        registrationNo: e.target.value,
                        isCustomRegNo: true,
                      }))
                    }
                    className="font-mono"
                    placeholder="e.g. REG_MERN_AARAV_SHARMA"
                  />
                  {regForm.isCustomRegNo ? (
                    <button
                      type="button"
                      onClick={() => {
                        const batchName = selectedBatch ? selectedBatch.name : "BATCH";
                        const profileName = profileForm.name || "STUDENT";
                        setRegForm((prev) => ({
                          ...prev,
                          registrationNo: buildRegistrationNumber(batchName, profileName),
                          isCustomRegNo: false,
                        }));
                      }}
                      className="absolute right-2 top-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Reset to Formula
                    </button>
                  ) : null}
                </div>
              </Field>
            </div>

            {/* Registration Summary Box */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Registration Review Summary
              </h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-zinc-500">Student Name:</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{profileForm.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">User Account:</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200">@{createdUser?.username}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Course:</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCourse?.name ?? "None"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Batch:</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBatch?.name ?? "Unassigned"}</dd>
                </div>
                <div className="col-span-2 pt-1">
                  <dt className="text-zinc-500">Generated Registration No:</dt>
                  <dd className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{regForm.registrationNo}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 md:col-span-2">
              <Button variant="secondary" onClick={() => setStep(2)} type="button">
                ← Back to Profile
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving Registration…"
                  : completedRegistration
                  ? "Update & Go to Payment →"
                  : "Next: Payment Step →"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={async () => {
                  try {
                    const findRes = await apiGet<ListResponse<Registration>>(
                      `/api/registrations?registrationNo=${encodeURIComponent(regForm.registrationNo.trim())}`
                    );
                    if (findRes.data && findRes.data.length > 0) {
                      setCompletedRegistration(findRes.data[0]);
                    }
                  } catch {}
                  if (selectedCourse && !paymentForm.rupees) {
                    const fee = selectedCourse.discountedPrice ?? selectedCourse.originalPrice;
                    if (fee) {
                      setPaymentForm((prev) => ({ ...prev, rupees: String(fee) }));
                    }
                  }
                  setStep(4);
                }}
              >
                Proceed to Payment Step →
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= STEP 4: REGISTRATION PAYMENT ================= */}
      {step === 4 && (
        <Card
          title="Step 4: Registration Payment"
          action={
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Reg No: {completedRegistration?.registrationNo || regForm.registrationNo}
            </span>
          }
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleStep4Submit}>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Course & Fee Summary
              </h4>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-zinc-500">Course</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedCourse?.name ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Assigned Batch</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedBatch?.name ?? "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Course Original Price</dt>
                  <dd className="font-mono text-zinc-700 dark:text-zinc-300">
                    {selectedCourse?.originalPrice ? `₹${selectedCourse.originalPrice}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Course Offer Price</dt>
                  <dd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedCourse?.discountedPrice ? `₹${selectedCourse.discountedPrice}` : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <Field
              label="Payment Amount (₹ / INR)"
              hint="Enter the registration fee or token payment received."
            >
              <div className="space-y-1.5">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 500, 1000, 5000"
                  value={paymentForm.rupees}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, rupees: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCourse?.discountedPrice ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          rupees: String(selectedCourse.discountedPrice),
                        }))
                      }
                      className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      Full Fee: ₹{selectedCourse.discountedPrice}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm((prev) => ({ ...prev, rupees: "500" }))
                    }
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Token: ₹500
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm((prev) => ({ ...prev, rupees: "1000" }))
                    }
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Token: ₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm((prev) => ({ ...prev, rupees: "2000" }))
                    }
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Token: ₹2,000
                  </button>
                </div>
              </div>
            </Field>

            <Field label="Payment Method" hint="Select how the payment was received.">
              <Select
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                }
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cheque">Cheque / Demand Draft</option>
                <option value="other">Other</option>
              </Select>
            </Field>

            <Field
              label="Transaction Ref / Proof"
              hint="UPI UTR number, bank reference ID, receipt number, or note."
            >
              <Input
                placeholder="e.g. UTR: 324109847291 or Cash Receipt #104"
                value={paymentForm.paymentProof}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, paymentProof: e.target.value }))
                }
              />
            </Field>

            <Field
              label="Verification Status"
              hint="Mark verified if payment was confirmed in account / received in cash."
            >
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isVerifiedCheck"
                  checked={paymentForm.isVerified}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, isVerified: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="isVerifiedCheck"
                  className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Mark as verified immediately
                </label>
              </div>
            </Field>

            <div className="flex flex-wrap items-center gap-3 pt-3 md:col-span-2">
              <Button variant="secondary" onClick={() => setStep(3)} type="button">
                ← Back to Registration
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Recording Payment…" : "Record Payment & Complete ✓"}
              </Button>
              <Button variant="ghost" onClick={handleSkipPayment} type="button">
                Skip Payment for Now →
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= STEP 5: COMPLETED SCREEN ================= */}
      {step === 5 && (
        <Card title="Registration Completed Successfully">
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold dark:bg-emerald-950">
                ✓
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Lead successfully converted to registered student!
                </h3>
                <p className="text-xs text-zinc-500">
                  Lead status has been marked as <strong>converted</strong> and all user credentials, profile, registration, and payment records have been saved.
                </p>
              </div>
            </div>

            {/* Registration Details */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Registration & Student Details
              </h4>
              <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">Registration Number</dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {completedRegistration?.registrationNo || regForm.registrationNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Student Name</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {createdProfile?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Username / Login</dt>
                  <dd className="mt-0.5 font-mono text-zinc-700 dark:text-zinc-300">
                    @{createdUser?.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Email Address</dt>
                  <dd className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                    {createdProfile?.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Enrolled Course</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedCourse?.name ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Assigned Batch</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedBatch?.name ?? "—"}
                  </dd>
                </div>
                {createdAddress ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-zinc-500">Address</dt>
                    <dd className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                      {createdAddress.addressLine}, {createdAddress.city}, {createdAddress.state} - {createdAddress.pincode}, {createdAddress.country}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {/* Payment Record Section */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Registration Payment Status
                </h4>
                {createdPayment ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      createdPayment.isVerified
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {createdPayment.isVerified ? "Payment Verified ✓" : "Payment Recorded (Pending Verification)"}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Payment Pending
                  </span>
                )}
              </div>

              {createdPayment ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="text-xs text-zinc-500">Amount Received</dt>
                    <dd className="mt-0.5 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(createdPayment.rupees).toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Payment Method</dt>
                    <dd className="mt-0.5 font-medium uppercase text-zinc-800 dark:text-zinc-200">
                      {createdPayment.paymentMethod.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Transaction Reference</dt>
                    <dd className="mt-0.5 font-mono text-zinc-700 dark:text-zinc-300">
                      {createdPayment.paymentProof || "N/A"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-zinc-500">
                    No payment was recorded during registration. You can record registration payment at any time:
                  </p>
                  {!showCompletePaymentForm ? (
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setShowCompletePaymentForm(true)}
                        type="button"
                      >
                        + Record Registration Payment Now
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleCompleteRecordPayment}
                      className="mt-3 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 md:grid-cols-2"
                    >
                      <Field label="Amount (₹)" hint="Received fee">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={paymentForm.rupees}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, rupees: e.target.value }))
                          }
                          placeholder="Amount in ₹"
                        />
                      </Field>
                      <Field label="Method">
                        <Select
                          value={paymentForm.paymentMethod}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                          }
                        >
                          <option value="upi">UPI</option>
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="card">Credit / Debit Card</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </Select>
                      </Field>
                      <Field label="Transaction Ref / Proof">
                        <Input
                          value={paymentForm.paymentProof}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, paymentProof: e.target.value }))
                          }
                          placeholder="e.g. UTR / Receipt No"
                        />
                      </Field>
                      <Field label="Verification">
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="inlineVerifyCheck"
                            checked={paymentForm.isVerified}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({ ...prev, isVerified: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="inlineVerifyCheck"
                            className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Mark verified
                          </label>
                        </div>
                      </Field>
                      <div className="flex items-center gap-2 pt-1 md:col-span-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Saving Payment…" : "Save Payment ✓"}
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setShowCompletePaymentForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => router.push("/manage/leads")}
              >
                ← Back to Leads
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/manage")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
