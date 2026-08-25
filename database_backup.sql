--
-- PostgreSQL database dump
--

\restrict 8KwPd5vjM4wAXBF7rlxPrVcNiV2MLL2GRJCjfWIUEM0jlAhrnCmfN4T4aZjUOA8

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CredentialStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CredentialStatus" AS ENUM (
    'ACTIVE',
    'USED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."CredentialStatus" OWNER TO postgres;

--
-- Name: EntryType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EntryType" AS ENUM (
    'QR',
    'DIRECT',
    'MANUAL'
);


ALTER TYPE public."EntryType" OWNER TO postgres;

--
-- Name: GazeboInquiryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GazeboInquiryStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'DISCUSSION',
    'HOLD',
    'APPROVED',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."GazeboInquiryStatus" OWNER TO postgres;

--
-- Name: GazeboStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GazeboStatus" AS ENUM (
    'AVAILABLE',
    'HELD',
    'CONFIRMED'
);


ALTER TYPE public."GazeboStatus" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'FEMALE',
    'MALE',
    'OTHER'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: InquiryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InquiryStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'CONFIRMED',
    'REJECTED'
);


ALTER TYPE public."InquiryStatus" OWNER TO postgres;

--
-- Name: PassType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PassType" AS ENUM (
    'SINGLE',
    'COUPLE',
    'GAZEBO',
    'KIDS'
);


ALTER TYPE public."PassType" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'ONLINE_GATEWAY',
    'UPI_QR',
    'CUSTOM_DIRECT'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'PASS_ISSUED',
    'REJECTED',
    'CANCELLED',
    'PAYMENT_FAILED'
);


ALTER TYPE public."RegistrationStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'TICKETING_FINANCE',
    'ENTRY_VERIFICATION',
    'ATTENDEE'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: ScanResult; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ScanResult" AS ENUM (
    'VALID',
    'ALREADY_USED',
    'CANCELLED',
    'INVALID_TOKEN',
    'WRONG_EVENT',
    'PAYMENT_NOT_CONFIRMED',
    'EXPIRED'
);


ALTER TYPE public."ScanResult" OWNER TO postgres;

--
-- Name: VerificationMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationMethod" AS ENUM (
    'QR_SCAN',
    'CASHIER',
    'MANUAL'
);


ALTER TYPE public."VerificationMethod" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AadhaarDocument; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AadhaarDocument" (
    id text NOT NULL,
    "attendeeId" text NOT NULL,
    "storageKey" text NOT NULL,
    "originalFilename" text NOT NULL,
    "mimeType" text NOT NULL,
    "sizeBytes" integer NOT NULL,
    checksum text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "checksumBack" text,
    "mimeTypeBack" text,
    "originalFilenameBack" text,
    "sizeBytesBack" integer,
    "storageKeyBack" text
);


ALTER TABLE public."AadhaarDocument" OWNER TO postgres;

--
-- Name: Attendee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendee" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    phone text NOT NULL,
    email text,
    gender public."Gender" DEFAULT 'FEMALE'::public."Gender" NOT NULL,
    "aadhaarHmac" text NOT NULL,
    "aadhaarMasked" text NOT NULL,
    "aadhaarEncrypted" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "kidsAgeGroup" text,
    dob timestamp(3) without time zone
);


ALTER TABLE public."Attendee" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    "targetEntity" text NOT NULL,
    "targetId" text,
    payload jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Credential; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Credential" (
    id text NOT NULL,
    "credentialNumber" text NOT NULL,
    "passCode" text NOT NULL,
    "registrationId" text NOT NULL,
    "attendeeId" text NOT NULL,
    "secureToken" text NOT NULL,
    status public."CredentialStatus" DEFAULT 'ACTIVE'::public."CredentialStatus" NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Credential" OWNER TO postgres;

--
-- Name: Entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Entry" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "attendeeId" text,
    "registrationId" text,
    "credentialId" text,
    "entryType" public."EntryType" DEFAULT 'QR'::public."EntryType" NOT NULL,
    "verificationMethod" public."VerificationMethod" DEFAULT 'QR_SCAN'::public."VerificationMethod" NOT NULL,
    "verifiedById" text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Entry" OWNER TO postgres;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    name text DEFAULT 'Safed Sheri 2026'::text NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO postgres;

--
-- Name: Gazebo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Gazebo" (
    id text NOT NULL,
    "gazeboNumber" text NOT NULL,
    level integer NOT NULL,
    price numeric(10,2) NOT NULL,
    status public."GazeboStatus" DEFAULT 'AVAILABLE'::public."GazeboStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Gazebo" OWNER TO postgres;

--
-- Name: GazeboInquiry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GazeboInquiry" (
    id text NOT NULL,
    "inquiryNumber" text NOT NULL,
    "gazeboId" text,
    level integer NOT NULL,
    "fullName" text NOT NULL,
    phone text NOT NULL,
    notes text,
    status public."GazeboInquiryStatus" DEFAULT 'NEW'::public."GazeboInquiryStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GazeboInquiry" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "registrationId" text NOT NULL,
    "paymentLocationId" text,
    "collectedById" text,
    amount numeric(10,2) NOT NULL,
    method public."PaymentMethod" DEFAULT 'ONLINE_GATEWAY'::public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "receiptNumber" text NOT NULL,
    provider text DEFAULT 'SAFED_SHERI_GATEWAY'::text NOT NULL,
    "providerReference" text,
    "paymentLinkId" text,
    notes text,
    "failureReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: PaymentLocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentLocation" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PaymentLocation" OWNER TO postgres;

--
-- Name: PricingPhase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PricingPhase" (
    id text NOT NULL,
    "phaseName" text NOT NULL,
    "singlePrice" numeric(10,2) NOT NULL,
    "couplePrice" numeric(10,2) NOT NULL,
    "nextSinglePrice" numeric(10,2),
    "nextCouplePrice" numeric(10,2),
    "showSinglePrice" boolean DEFAULT true NOT NULL,
    "showCouplePrice" boolean DEFAULT true NOT NULL,
    "showGazeboPrice" boolean DEFAULT false NOT NULL,
    "isCountdownActive" boolean DEFAULT false NOT NULL,
    "countdownTarget" timestamp(3) without time zone,
    "urgencyTagline" text,
    "hiddenPriceLabel" text DEFAULT 'Price Revealed on Approval'::text,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PricingPhase" OWNER TO postgres;

--
-- Name: Registration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Registration" (
    id text NOT NULL,
    "registrationNumber" text NOT NULL,
    "eventId" text NOT NULL,
    "pricingPhaseId" text NOT NULL,
    "passType" public."PassType" DEFAULT 'SINGLE'::public."PassType" NOT NULL,
    status public."RegistrationStatus" DEFAULT 'SUBMITTED'::public."RegistrationStatus" NOT NULL,
    "amountDue" numeric(10,2) NOT NULL,
    "paymentLinkId" text,
    "reviewNotes" text,
    "reviewedById" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Registration" OWNER TO postgres;

--
-- Name: RegistrationAttendee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RegistrationAttendee" (
    "registrationId" text NOT NULL,
    "attendeeId" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    status public."RegistrationStatus" DEFAULT 'SUBMITTED'::public."RegistrationStatus" NOT NULL,
    "reviewNotes" text,
    "reviewedAt" timestamp(3) without time zone
);


ALTER TABLE public."RegistrationAttendee" OWNER TO postgres;

--
-- Name: ScanAttempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ScanAttempt" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "credentialId" text,
    "scannedById" text NOT NULL,
    result public."ScanResult" NOT NULL,
    "rawTokenScanned" text NOT NULL,
    "scannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ScanAttempt" OWNER TO postgres;

--
-- Name: SponsorInquiry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SponsorInquiry" (
    id text NOT NULL,
    "companyName" text NOT NULL,
    "contactName" text NOT NULL,
    phone text NOT NULL,
    email text,
    "sponsorshipType" text,
    notes text,
    status public."InquiryStatus" DEFAULT 'NEW'::public."InquiryStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SponsorInquiry" OWNER TO postgres;

--
-- Name: StallInquiry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StallInquiry" (
    id text NOT NULL,
    "brandName" text NOT NULL,
    "contactName" text NOT NULL,
    phone text NOT NULL,
    category text,
    notes text,
    status public."InquiryStatus" DEFAULT 'NEW'::public."InquiryStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StallInquiry" OWNER TO postgres;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSetting" (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    "fullName" text NOT NULL,
    role public."Role" DEFAULT 'ATTENDEE'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: AadhaarDocument; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AadhaarDocument" (id, "attendeeId", "storageKey", "originalFilename", "mimeType", "sizeBytes", checksum, "createdAt", "updatedAt", "checksumBack", "mimeTypeBack", "originalFilenameBack", "sizeBytesBack", "storageKeyBack") FROM stdin;
f3646b11-008e-4e94-b0c3-992cc9ade4e2	76843426-6af2-4b19-8f0d-5367d65e34eb	2fd71f2e-78cb-4ff0-ac94-184f17a294c0.png	dhol.png	image/jpeg	1024	sha256_checksum	2026-08-24 11:40:30.761	2026-08-24 11:40:30.761	\N	\N	dandiya.png	\N	af3fa34b-f18c-45f2-bc5b-6d0498d4ff96.png
1e062fe2-5f59-448d-9644-fe7717890bed	964b84a6-ad92-4b5b-bbfd-e22961b63ef0	7b8764c0-32a5-460d-99ca-0097146d49a6.png	dandiya.png	image/jpeg	1024	sha256_checksum	2026-08-24 11:40:30.774	2026-08-24 11:40:30.774	\N	\N	dhol.png	\N	ad194a71-77a7-41a2-8308-0da7c7df82e9.png
377bfec5-f2ee-4ba4-a0da-a06f7d425fd4	b89062d8-95b2-4dc8-ac56-6916a0af4c1e	demo_doc_101.jpg	aadhaar_card_Ananya_Sharma.jpg	image/jpeg	245000	eb2b036d50422d37afadd3e5cdfdac32227f7e8e5e8d4a881a42eed337dec13e	2026-08-24 11:37:46.688	2026-08-24 11:37:46.688	\N	\N	\N	\N	\N
47f396b6-73b6-4ec0-aeea-cd38d67e624d	5a64017a-6a57-4f7e-a882-2fdc4c315983	demo_doc_102.jpg	aadhaar_card_Riya_Patel.jpg	image/jpeg	245000	2ddf46d5783489f1e7b6de6220ee1def05ba983aac9929ed87cc963b36581d81	2026-08-24 11:37:46.709	2026-08-24 11:37:46.709	\N	\N	\N	\N	\N
04848ca3-8508-4058-a6c1-bdd1c7d4bfb4	9b929bd7-324d-4eea-b179-396104fab46d	demo_doc_103.jpg	aadhaar_card_Pooja_Joshi.jpg	image/jpeg	245000	795da32fdd26b0eac83bfe5f56bb8fcc023b61f39f30f6149d55adb8a658a6f6	2026-08-24 11:37:46.726	2026-08-24 11:37:46.726	\N	\N	\N	\N	\N
085a2524-b4ec-4fbf-999f-00d26eb70f1c	6c4040dc-a35c-48b6-b023-91e714ea266f	demo_doc_104.jpg	aadhaar_card_Diya_Trivedi.jpg	image/jpeg	245000	c5a27972774d1a957517e0e8eb57634c47cf49a6f3282a8f38e40d51d7754ced	2026-08-24 11:37:46.753	2026-08-24 11:37:46.753	\N	\N	\N	\N	\N
6cb989cb-18ec-4ed6-8d2b-771704cc2464	1b81be44-7216-464f-8ba6-f81359acd345	demo_doc_105.jpg	aadhaar_card_Kavya_Desai.jpg	image/jpeg	245000	18e64a84e9fb186ac76d5687898ff4e3701d52faec215a09af991891b7cbcd59	2026-08-24 11:37:46.773	2026-08-24 11:37:46.773	\N	\N	\N	\N	\N
575315a3-91c7-4947-869d-71a602a4e910	6b5e9370-6196-4c44-8ddb-d6d80ba4ad29	demo_doc_106.jpg	aadhaar_card_Ishita_Shah.jpg	image/jpeg	245000	d0a9212d1e6f96fc2c72b7de814db0f08cf96438de5661fce29072187c24bacf	2026-08-24 11:37:46.794	2026-08-24 11:37:46.794	\N	\N	\N	\N	\N
28e983b2-6828-4096-9389-a6dc3381d1bd	aa9e6fff-daba-4bfc-8ed9-98b32ff086a9	demo_doc_107.jpg	aadhaar_card_Tanvi_Mehta.jpg	image/jpeg	245000	82c1db12f474a0c273b1fa806e6e74089ceb02614616e876559e989d92a98ce0	2026-08-24 11:37:46.809	2026-08-24 11:37:46.809	\N	\N	\N	\N	\N
1a6ad8a6-9d39-4b9f-a9d3-64e03b5a791d	373c58f8-e659-435a-b40e-1d055b0533ca	demo_doc_108.jpg	aadhaar_card_Niyati_Bhatt.jpg	image/jpeg	245000	c5adf319323318706abc2bfd617615d71a70838c150083cbfd58413656017311	2026-08-24 11:37:46.824	2026-08-24 11:37:46.824	\N	\N	\N	\N	\N
d29e10a0-1720-4f8e-9fdd-39dcb14c1675	10ea55b6-0309-4988-8d2c-2229e3176707	demo_doc_109.jpg	aadhaar_card_Avani_Dave.jpg	image/jpeg	245000	ae7551b2576d823bab49ab0ed503c0333f7892c2400707d2aea20d7523b47ee2	2026-08-24 11:37:46.84	2026-08-24 11:37:46.84	\N	\N	\N	\N	\N
9a1cbe29-cfd5-4e18-9833-8d900529f99f	69316941-f21f-4385-95a6-0348b7befb3b	demo_doc_110.jpg	aadhaar_card_Sneha_Vora.jpg	image/jpeg	245000	1c4a800e4c505c7fd55af19db95c6be4d44933aac796f6192bcab51696a10da7	2026-08-24 11:37:46.856	2026-08-24 11:37:46.856	\N	\N	\N	\N	\N
3e330d07-b09c-4079-b50f-53932f8e158e	4a3f4b26-47cf-4a5e-afb1-2dcbf19d06b9	demo_doc_111.jpg	aadhaar_card_Khushi_Parikh.jpg	image/jpeg	245000	115f84bfbf144f1e0ffaeb16a5376824252f9839dc4dcda935da3ef07d572d99	2026-08-24 11:37:46.869	2026-08-24 11:37:46.869	\N	\N	\N	\N	\N
692a1a1b-5092-4f1c-89e4-d5277399ffaf	c1608127-72a9-47b3-bc61-52d83b14c7a3	demo_doc_112.jpg	aadhaar_card_Radhika_Vyas.jpg	image/jpeg	245000	82e13c08cede4c270b4988b4ed419a228fd85558d7c7402a11972612455badb7	2026-08-24 11:37:46.885	2026-08-24 11:37:46.885	\N	\N	\N	\N	\N
5be49ed6-ef47-4e66-86be-1811e3375c0a	f242dc20-c343-443e-a234-ecdaaff1ddc1	demo_doc_113.jpg	aadhaar_card_Bhavna_Rathod.jpg	image/jpeg	245000	55649ac73f6070403e6530e037621e8471c5e1a1f93d5bbf60ac04a5c36ed2cb	2026-08-24 11:37:46.902	2026-08-24 11:37:46.902	\N	\N	\N	\N	\N
df8450b9-cb9e-4968-acea-e3a34710cb92	b15e392a-86a4-4808-843c-e501dd83ed02	demo_doc_114.jpg	aadhaar_card_Priyanka_Shukla.jpg	image/jpeg	245000	b64c3761c5e69bc8106fc95a08748ec8933650a893d0ab0534b8647051c08315	2026-08-24 11:37:46.918	2026-08-24 11:37:46.918	\N	\N	\N	\N	\N
2ce50d17-c112-4cc0-b5a9-8dd93c026a20	7affed51-2c81-48b1-b122-5be6a8081ce1	demo_doc_115.jpg	aadhaar_card_Drashti_Zala.jpg	image/jpeg	245000	59939d049c76f73c92a478f68558c1f1b37568a42a2abdd29b1551bcd4918a4e	2026-08-24 11:37:46.935	2026-08-24 11:37:46.935	\N	\N	\N	\N	\N
52a7dbb8-d035-4439-ab81-0ab23e2b8dec	488cf082-8c88-47a9-86f9-efdb0e777962	demo_doc_116.jpg	aadhaar_card_Meera_Panchal.jpg	image/jpeg	245000	5e52f774a51013a67f13e2770488efe61eda5c46279e29bfde56cb56c83eda3e	2026-08-24 11:37:46.949	2026-08-24 11:37:46.949	\N	\N	\N	\N	\N
55314fc6-c121-433a-a96a-36aca8624c6b	145b95ec-8cb4-4136-ba94-d5c1487098f7	demo_doc_117.jpg	aadhaar_card_Krutika_Chauhan.jpg	image/jpeg	245000	62ffe20abffc24314e241e69c60773b437d17ab0ac87761387227f91588e3ae9	2026-08-24 11:37:46.977	2026-08-24 11:37:46.977	\N	\N	\N	\N	\N
92a6f6f8-9201-4a01-8783-598b4d64f3ce	6edbf979-570c-48b8-84a7-25b55b92d096	demo_doc_118.jpg	aadhaar_card_Kinjal_Gandhi.jpg	image/jpeg	245000	263c922603278575ba3c1c664402f452464a3b77678803c62bd63c3ca86fb893	2026-08-24 11:37:46.999	2026-08-24 11:37:46.999	\N	\N	\N	\N	\N
2e7c33c5-133d-44f9-83a1-089316dee167	62aeff75-3276-46e7-b801-0a7b6088d853	demo_doc_119.jpg	aadhaar_card_Jhanvi_Rawal.jpg	image/jpeg	245000	c1d43d2e429bc14fbe8f48077ba1d1807aba261470dd498a8b23d6bfe1e6c0de	2026-08-24 11:37:47.018	2026-08-24 11:37:47.018	\N	\N	\N	\N	\N
9e32eaaa-738b-4377-8872-b0f52111e1d6	0eecd093-e618-47c1-b1f5-11589ee16f53	demo_doc_120.jpg	aadhaar_card_Kiran_Patel.jpg	image/jpeg	245000	6cffbbc1ff7daafdccf4a8eb6c3e1844c28dd7498a7edfdfde5115ae38a73ccc	2026-08-24 11:37:47.037	2026-08-24 11:37:47.037	\N	\N	\N	\N	\N
96705f56-a76e-486f-89a6-b5248aeb3dcb	6546d88b-437d-45fd-a292-d428351d29de	demo_doc_121.jpg	aadhaar_card_Hetal_Soni.jpg	image/jpeg	245000	b5e6ae9753e3ece4a16b185c06ffbfc562b5ea7c7fdfea6b18a8e45e90d1b903	2026-08-24 11:37:47.059	2026-08-24 11:37:47.059	\N	\N	\N	\N	\N
b40586bd-9e98-47ca-b78a-eeb8a0b28c23	263f5594-8f8a-41e3-a641-20b57a0f0c9d	demo_doc_122.jpg	aadhaar_card_Swati_Raval.jpg	image/jpeg	245000	4f91cef3097709a779717c95bee4e9a4139ea9408580af6a2511f95bec23f520	2026-08-24 11:37:47.078	2026-08-24 11:37:47.078	\N	\N	\N	\N	\N
a6d7d9c2-fc18-4631-9ce9-be43f44f8692	80ce788d-afb5-4f40-b72f-dd5cde663f1b	demo_doc_123.jpg	aadhaar_card_Bhoomi_Goswami.jpg	image/jpeg	245000	70230654244131b7e964be9efad6b5227ed3b4882b53fb402a372f51b5a28c93	2026-08-24 11:37:47.097	2026-08-24 11:37:47.097	\N	\N	\N	\N	\N
2f44a37e-0a22-4739-88fd-5adddda4dfa6	d827e489-a44a-4efe-aea4-8974c180c18d	demo_doc_124.jpg	aadhaar_card_Shreya_Purohit.jpg	image/jpeg	245000	81aa66b9fd332fcb7a67b549181cc0e3bfef348d83cf478c0284eac504ca37dd	2026-08-24 11:37:47.119	2026-08-24 11:37:47.119	\N	\N	\N	\N	\N
6bf22659-3c51-4db2-a372-b0d621a42fed	0a3f73ec-d434-4e82-bc23-1589b7cada50	demo_doc_125.jpg	aadhaar_card_Vidhi_Thakkar.jpg	image/jpeg	245000	7b4da862646c14188a794797ff5c53e84ece7d19445d87b04e0e63a6093aae2b	2026-08-24 11:37:47.139	2026-08-24 11:37:47.139	\N	\N	\N	\N	\N
566e4c88-9b66-4f08-adc7-34db2f5de9f4	d866f99d-317d-440d-8160-78614bae9b70	demo_doc_126.jpg	aadhaar_card_Jiya_Modi.jpg	image/jpeg	245000	af99f5876ec948f917c3b81354a47be67a7f18c27ff5450421bf4a97bed91130	2026-08-24 11:37:47.159	2026-08-24 11:37:47.159	\N	\N	\N	\N	\N
79786a7f-d381-465b-98c7-f826e1bc6b50	8822bea3-95db-4ddd-9a04-34273b7ad6e3	demo_doc_127.jpg	aadhaar_card_Rahul_Mehta.jpg	image/jpeg	245000	27b7c44084c7f2b36aadc973585097eb94a6d701dbe00578d0ad3ce424a05ade	2026-08-24 11:37:47.163	2026-08-24 11:37:47.163	\N	\N	\N	\N	\N
07a1b877-3e16-4b27-b0f5-17d8cf12ca8e	59a1cf1f-9a0b-425e-8917-8cd5e20951b8	demo_doc_128.jpg	aadhaar_card_Rupal_Barot.jpg	image/jpeg	245000	4db3c90dae69bd2a232ffd1486988a1a3f0a55eaacce70a2051bc27ee3950bf5	2026-08-24 11:37:47.18	2026-08-24 11:37:47.18	\N	\N	\N	\N	\N
b3ec785f-8957-40a0-865c-50d2e7163abb	acb3fc34-51aa-428b-9b32-1e5c51fa79a1	demo_doc_129.jpg	aadhaar_card_Aakash_Patel.jpg	image/jpeg	245000	4557770e842c77738b5e2816a5bca7ccef5b443f4b04dab3879ee7cfedd62b6d	2026-08-24 11:37:47.184	2026-08-24 11:37:47.184	\N	\N	\N	\N	\N
f26b7dc7-7552-4547-be83-3db566fc2803	0a5e5647-1b01-484b-8255-8aa5c44b8352	demo_doc_130.jpg	aadhaar_card_Purvi_Pandya.jpg	image/jpeg	245000	b325ea39c06ac43f357d241e696402c61b66a8919a4bd079ef93b8c067401521	2026-08-24 11:37:47.203	2026-08-24 11:37:47.203	\N	\N	\N	\N	\N
cb9cfee1-8da6-415f-bdae-969101bdf1ca	af7f879d-d231-4c32-9541-1c211c502f38	demo_doc_131.jpg	aadhaar_card_Rohan_Shah.jpg	image/jpeg	245000	c086a11fc4c1b7c40d47f73ff1108416a75a327a5fd508997b1c0015c04eb0dd	2026-08-24 11:37:47.212	2026-08-24 11:37:47.212	\N	\N	\N	\N	\N
9b8439e6-ea30-40e4-bba3-3f3516bdd988	96461f20-d533-400a-aa08-0a622e429d51	demo_doc_132.jpg	aadhaar_card_Krupa_Solanki.jpg	image/jpeg	245000	faec60ab07105f871da4b71e493d6e75ad836ea53f600db38668e1f170c40381	2026-08-24 11:37:47.228	2026-08-24 11:37:47.228	\N	\N	\N	\N	\N
7463c7e8-af56-4f6e-9f69-d1333af9b868	d60e8660-8f36-4409-8a1f-278aa2e7e543	demo_doc_133.jpg	aadhaar_card_Aditya_Joshi.jpg	image/jpeg	245000	b85598f49a711f4a5cca8ecbd8067467c11bfb6526fff3627761d4b8268d7bcd	2026-08-24 11:37:47.232	2026-08-24 11:37:47.232	\N	\N	\N	\N	\N
54691d9d-6d14-4fcb-be8d-206951b1549e	e6cdca11-225a-4ebb-a155-3fd14d4f7c47	demo_doc_134.jpg	aadhaar_card_Mansi_Kotak.jpg	image/jpeg	245000	ca0a4481faa29bd10cc6b87c0cbce13fc0eea6879fc2863b002a22b912a076dc	2026-08-24 11:37:47.249	2026-08-24 11:37:47.249	\N	\N	\N	\N	\N
18eecf83-f5b5-4781-8068-a87ed1f21b40	f78e9a40-a66c-40dd-8cca-505317ed6404	demo_doc_135.jpg	aadhaar_card_Kunal_Trivedi.jpg	image/jpeg	245000	5665bae5c5b08bcf6d198fb55b7fb41587e8dc4435db4a37b59d9f6acd81edbc	2026-08-24 11:37:47.252	2026-08-24 11:37:47.252	\N	\N	\N	\N	\N
27369d11-6122-4b64-a49e-b108bb7b97bf	66d3185f-c890-4600-8ea9-0e6ae7d67c37	demo_doc_136.jpg	aadhaar_card_Isha_Kapadia.jpg	image/jpeg	245000	8136a3dbc19c800856db017a5d54435bd33276592ff29f65961f792d2767d250	2026-08-24 11:37:47.271	2026-08-24 11:37:47.271	\N	\N	\N	\N	\N
3a012687-bad1-4db6-b56b-1cb1c88f2ab6	72aa7d48-17b8-485e-a3e1-f280f0121226	demo_doc_137.jpg	aadhaar_card_Harsh_Desai.jpg	image/jpeg	245000	78db890ebfe2a0f216fea907d193acfb4911282ccc8f214b45d1537e50929932	2026-08-24 11:37:47.277	2026-08-24 11:37:47.277	\N	\N	\N	\N	\N
2f30615e-9259-4089-8b09-51ed8017396e	c369821a-c8b8-42cd-b25c-57f3f4c6787b	demo_doc_138.jpg	aadhaar_card_Nidhi_Sanghavi.jpg	image/jpeg	245000	26f5c499b784c39a0749e7a7d9850403f6c9a48e5e74c87db7d4aa31525db01f	2026-08-24 11:37:47.298	2026-08-24 11:37:47.298	\N	\N	\N	\N	\N
f3730b8d-ee01-4f4a-98c0-f1f9ffa34349	8a9f1fe1-c092-4415-a400-ee6825a65b62	demo_doc_139.jpg	aadhaar_card_Siddharth_Dave.jpg	image/jpeg	245000	045c066148415726a3cd71c4c19cb41d98fb2f3c46319bad5676e6c8d6c32e40	2026-08-24 11:37:47.302	2026-08-24 11:37:47.302	\N	\N	\N	\N	\N
15b4ce82-5231-4972-b2b7-32c962c4f329	8a43ed2e-3a93-4ef1-bb51-2d3f8ddac193	demo_doc_140.jpg	aadhaar_card_Palak_Dave.jpg	image/jpeg	245000	680daf7ad558161f4b7d43ad157139546cd441f2ba3bfbb3dc27244dae445758	2026-08-24 11:37:47.323	2026-08-24 11:37:47.323	\N	\N	\N	\N	\N
db9383df-2e73-4736-a58a-42ae2676b98c	6c9c3ecb-c5f2-4be4-8b86-3231e4281d8e	demo_doc_141.jpg	aadhaar_card_Yash_Vora.jpg	image/jpeg	245000	2ce6ed2e583419729a20105f3e8ed43c840dcbe8b53dc01a931c6ee8643d0172	2026-08-24 11:37:47.33	2026-08-24 11:37:47.33	\N	\N	\N	\N	\N
d7e1fd34-1549-4670-b803-3bc3372de906	0d823321-e69a-4f1e-896f-e4400b984546	demo_doc_142.jpg	aadhaar_card_Komal_Shah.jpg	image/jpeg	245000	423e84bfc852b38421f6ee8aef8445d780882971fb42eef95a4733b001386a71	2026-08-24 11:37:47.349	2026-08-24 11:37:47.349	\N	\N	\N	\N	\N
6284871b-e86a-443c-bf2d-7306282c9bfd	39301089-3e6e-42e7-a25d-28d692f03051	demo_doc_143.jpg	aadhaar_card_Parth_Bhatt.jpg	image/jpeg	245000	0fa45d0b69b33738ae6175641f9dd23f898b8a442b388e67b9baa6319ad21d0c	2026-08-24 11:37:47.356	2026-08-24 11:37:47.356	\N	\N	\N	\N	\N
2be54361-1055-4fa8-8f62-efbd822e8dc7	a0b0dfb3-3bef-4dd7-9386-6942e884b223	demo_doc_144.jpg	aadhaar_card_Aarohi_Mehta.jpg	image/jpeg	245000	e2da9d666d3b590fb1213295a8688a7c417f0670aa4a11594a98f90cb023f66a	2026-08-24 11:37:47.375	2026-08-24 11:37:47.375	\N	\N	\N	\N	\N
7cfdcce9-1a51-48e3-a398-24490915a7b6	88511bf3-a7d7-4318-b9c7-64b13b36ba40	demo_doc_145.jpg	aadhaar_card_Devang_Parikh.jpg	image/jpeg	245000	c31b4b2b40d5ba5aa3144e001036056666e3753bc91acefcdd605da623eed8de	2026-08-24 11:37:47.379	2026-08-24 11:37:47.379	\N	\N	\N	\N	\N
8721da8e-d9f0-4075-a2d5-b2163659a329	74dfe834-aea0-4442-82cd-15faf9943dc5	demo_doc_146.jpg	aadhaar_card_Krishna_Patel.jpg	image/jpeg	245000	74a6f1acacfab32ee269cc1e6c91c6f5c124e01df09d06723c144f50d376e69b	2026-08-24 11:37:47.398	2026-08-24 11:37:47.398	\N	\N	\N	\N	\N
b48b4aa7-b678-4c76-b6a6-a8fa64993141	71288b58-62d4-4cae-9d89-83e3fc91aca6	demo_doc_147.jpg	aadhaar_card_Manan_Vyas.jpg	image/jpeg	245000	e63541a22b5ce25859cc7fcbdd386210d163c20648196935bf49bf4cda62ca56	2026-08-24 11:37:47.402	2026-08-24 11:37:47.402	\N	\N	\N	\N	\N
1d17a072-90a1-4c6a-bfc1-7d898044212a	9b873340-d10d-4465-ba60-c8831b17a3b7	demo_doc_148.jpg	aadhaar_card_Devanshi_Trivedi.jpg	image/jpeg	245000	9cae6dcd512570d58facf65043ff53d2e207973e384104c7e88215e0a1063448	2026-08-24 11:37:47.425	2026-08-24 11:37:47.425	\N	\N	\N	\N	\N
1a92e692-319f-43f7-879d-8351b7999acc	a72eadd7-7e2d-4c20-8adf-be2a27df1140	demo_doc_149.jpg	aadhaar_card_Neel_Rathod.jpg	image/jpeg	245000	9fe9d72bd84c304318da67fd0f929cc9c64e1eef4da4b382029012ab99fdbb67	2026-08-24 11:37:47.429	2026-08-24 11:37:47.429	\N	\N	\N	\N	\N
dc5fa9c0-240f-4912-9076-6aa48aa0a8d9	6b939f39-a109-4ed4-b8f9-5f9cfc782ea3	demo_doc_150.jpg	aadhaar_card_Gopi_Joshi.jpg	image/jpeg	245000	e86c3ee4f6391b5eddc6b54c030ea616dcb6f7a7db80723d11ad35b0a46fce05	2026-08-24 11:37:47.433	2026-08-24 11:37:47.433	\N	\N	\N	\N	\N
de91d3c3-6b74-4771-8f5e-ab29dba90aa7	c8b2ca97-28f0-46e8-acb2-65babbe0b84a	demo_doc_151.jpg	aadhaar_card_Payal_Vaghela.jpg	image/jpeg	245000	0726a06f57be894926013a14022adbe2dda2527c449c362723cf569af10d633d	2026-08-24 11:37:47.461	2026-08-24 11:37:47.461	\N	\N	\N	\N	\N
a651ef8e-d182-4b91-8818-22531446c7e4	91d0d488-6f35-4b85-ba4a-1ed4411a7e0b	demo_doc_152.jpg	aadhaar_card_Tirth_Shukla.jpg	image/jpeg	245000	d360b332c75dda7bd2e1012950e7bd2ba04fa31041ba98781e82ada56808bc94	2026-08-24 11:37:47.465	2026-08-24 11:37:47.465	\N	\N	\N	\N	\N
72643e50-93a1-41cb-ad13-1d4078f9893e	19ca0bb7-3514-4a5e-a047-83d383bab26b	demo_doc_153.jpg	aadhaar_card_Shweta_Acharya.jpg	image/jpeg	245000	e6dbffa0a80a65c213ca7515f9823d954ccf7a11777ed964d1f67d0d7ef99168	2026-08-24 11:37:47.47	2026-08-24 11:37:47.47	\N	\N	\N	\N	\N
3abf9697-4c49-4bbd-a910-665e04f3d163	bb9a5264-da76-4bfb-a8f4-631aa4e92068	demo_doc_154.jpg	aadhaar_card_Asha_Solanki.jpg	image/jpeg	245000	411a3f6b31aea49963a5be05917e936adf318d92a81306aadf3a63a747ee73be	2026-08-24 11:37:47.495	2026-08-24 11:37:47.495	\N	\N	\N	\N	\N
f9019b68-5b2a-45dd-8547-15609fbb6fc2	f90b34f2-19b7-47ad-aad1-3f95280935ce	demo_doc_155.jpg	aadhaar_card_Bhumika_Vyas.jpg	image/jpeg	245000	3c85016ece4361f146f03600f0f39ecc74c1064fd8a13fafc6060161c3e18273	2026-08-24 11:37:47.503	2026-08-24 11:37:47.503	\N	\N	\N	\N	\N
92b5aecf-e83e-4c05-a73a-b216b391f8fe	66f0301b-f6d8-493b-89c5-389d092d460c	demo_doc_156.jpg	aadhaar_card_Charmi_Patel.jpg	image/jpeg	245000	1c6d17bae6664d49b804ce387d11d7383e40c011254d654a8e0d1560fc90e3f0	2026-08-24 11:37:47.513	2026-08-24 11:37:47.513	\N	\N	\N	\N	\N
683f8d26-bf48-4514-b309-58a994e1717c	8a8bf8b1-9bdb-4364-8862-eea1cadd4e1a	demo_doc_157.jpg	aadhaar_card_Dhara_Shukla.jpg	image/jpeg	245000	ec0db0682a4ba729a7bf66f93d62c4bcb5983749d334227de9cbf1cb9ea15f96	2026-08-24 11:37:47.521	2026-08-24 11:37:47.521	\N	\N	\N	\N	\N
d82ed6c8-caf6-45ae-85af-ce2d73c1dd2f	9e436ba1-8ab4-4776-928b-6dc7f5602b9c	demo_doc_158.jpg	aadhaar_card_Ekta_Dave.jpg	image/jpeg	245000	179cc95052d69abcedc026bf79231a4ceb4786415736b41405d406de9695763a	2026-08-24 11:37:47.529	2026-08-24 11:37:47.529	\N	\N	\N	\N	\N
78acd230-45b0-4cfd-971b-e3078797d532	58c1600f-90ea-4bbb-ac20-a54fba6b6e09	demo_doc_159.jpg	aadhaar_card_Falguni_Mehta.jpg	image/jpeg	245000	026b781a83f9164b5d67e1b3207ad5e526a1e30d8ce00abbaa490152669d74a6	2026-08-24 11:37:47.537	2026-08-24 11:37:47.537	\N	\N	\N	\N	\N
66dbd694-a34b-4b1b-bbc3-65dedaf98d8c	c6fd89e8-094c-41a2-8163-b3df78128e81	demo_doc_160.jpg	aadhaar_card_Geeta_Shah.jpg	image/jpeg	245000	046a0a0eefbd6d979b5e0a7e9dad2c6e1322eb9fd02288184ee3b33ddb2b8acf	2026-08-24 11:37:47.546	2026-08-24 11:37:47.546	\N	\N	\N	\N	\N
61fc1718-9f8f-428f-a11a-076df209a07c	0e233735-eadb-4989-8b6f-1818a359817d	demo_doc_161.jpg	aadhaar_card_Hina_Joshi.jpg	image/jpeg	245000	7ebeca2f2dd503a210aca0be159cfa1912c66baad9f2524d457f5ca9b73e0c0b	2026-08-24 11:37:47.553	2026-08-24 11:37:47.553	\N	\N	\N	\N	\N
831b9a40-bbb6-4c68-8836-3c179efb54e5	5e21e48b-dc8b-4ce6-a8f6-ce08beee0c7f	demo_doc_162.jpg	aadhaar_card_Ila_Trivedi.jpg	image/jpeg	245000	6151d96f4d6c23f4df83358977a30e29e4eb7f09d59e7804b2c0ac5367548551	2026-08-24 11:37:47.562	2026-08-24 11:37:47.562	\N	\N	\N	\N	\N
c4699e95-598b-4f7b-8e89-5854c1ce757e	f994c038-80b4-413d-b769-1b7a450e3970	demo_doc_163.jpg	aadhaar_card_Janki_Desai.jpg	image/jpeg	245000	1c2cfb457cae1284fc4a3402ed7c27b721d191361cd79bc7b479c1f74507867a	2026-08-24 11:37:47.569	2026-08-24 11:37:47.569	\N	\N	\N	\N	\N
c9d5c082-8808-4ffc-ad8b-5f03c2683687	2ee3a62f-e5a3-416e-ae59-1502a697efdc	demo_doc_164.jpg	aadhaar_card_Kajal_Bhatt.jpg	image/jpeg	245000	1b34f56e4904ff79865f7b1d1580c49e51e1ad040499cecfe0023868085a7241	2026-08-24 11:37:47.577	2026-08-24 11:37:47.577	\N	\N	\N	\N	\N
74426cc1-d4bc-479a-bf76-61ec67b790bd	af267efb-bd47-410e-bcdc-1a13c0316380	demo_doc_165.jpg	aadhaar_card_Lata_Vora.jpg	image/jpeg	245000	c9aaa92b153e9fa78a63532c8618f41e2e9d484c0ffafd61a426832b94e4a1a2	2026-08-24 11:37:47.585	2026-08-24 11:37:47.585	\N	\N	\N	\N	\N
5ddb7dfa-d661-4150-9147-50b3f7aa4ec6	c9f4a0cf-5739-4562-b7a2-b16315bc1789	demo_doc_166.jpg	aadhaar_card_Mamta_Parikh.jpg	image/jpeg	245000	174cffb9c0a76ed3c6ddc204c558fcd8217b18c4af7129ecda58755a907a7380	2026-08-24 11:37:47.594	2026-08-24 11:37:47.594	\N	\N	\N	\N	\N
4c63fcee-fcd6-4440-9633-7abd8a468069	db30cd37-52bb-4687-90af-9a95cf39d937	demo_doc_167.jpg	aadhaar_card_Neeta_Rathod.jpg	image/jpeg	245000	11fbfbab2d475a7e8d416c19e8057086743eb089b884eb4ff0dbdedd6db9fc14	2026-08-24 11:37:47.602	2026-08-24 11:37:47.602	\N	\N	\N	\N	\N
c79266d0-27f7-43e9-a5eb-be51225c52e0	d9ef809e-0c20-43c5-aaf3-1e333a52683d	demo_doc_168.jpg	aadhaar_card_Priti_Panchal.jpg	image/jpeg	245000	f8ee59ac96bbb05daa43f8dfea5341ab8c6f1cbf020fe4718406e6fe88e1025a	2026-08-24 11:37:47.615	2026-08-24 11:37:47.615	\N	\N	\N	\N	\N
87104d02-15fd-410f-8e6a-4f7b8d5cd260	997c2907-9726-4d22-8566-66c505df8d6b	demo_doc_169.jpg	aadhaar_card_Rekha_Chauhan.jpg	image/jpeg	245000	f9429483a393371c03ca06b74a14552c093c3a8205ac5702162fbf3629e719a8	2026-08-24 11:37:47.623	2026-08-24 11:37:47.623	\N	\N	\N	\N	\N
966cb585-5251-4380-a55a-e154c26ed39b	8a6fbb66-1a07-4cba-b828-465d625a2c36	demo_doc_170.jpg	aadhaar_card_Seema_Gandhi.jpg	image/jpeg	245000	f94c741dd7b411bb92efda43d5f547ca490e4a5821df40573dafa44e93757414	2026-08-24 11:37:47.632	2026-08-24 11:37:47.632	\N	\N	\N	\N	\N
02e55071-16b1-430f-8bdb-4d5278f5d786	de58e366-0a30-4f4f-a35d-dae49b4f600d	demo_doc_171.jpg	aadhaar_card_Tejal_Rawal.jpg	image/jpeg	245000	2aa57d5475ae78bdbd86e58e4c3dc3837e387f7098e1e238b767c8783b3d1e73	2026-08-24 11:37:47.64	2026-08-24 11:37:47.64	\N	\N	\N	\N	\N
03c2824a-3ff7-4fb8-bb74-955d2b8ff7c2	36fbd438-ed66-4a71-b401-ea630a09ba71	demo_doc_172.jpg	aadhaar_card_Urvashi_Patel.jpg	image/jpeg	245000	ad04fc33cbf1a4f5e0c66cf651c34d3c24cb6ca0be7c7adb754b085331f75cae	2026-08-24 11:37:47.647	2026-08-24 11:37:47.647	\N	\N	\N	\N	\N
caa5e04a-e9ab-4ade-a4cd-f02a08f90472	cbbe770a-9a7b-4846-aae7-d01a800db9b1	demo_doc_173.jpg	aadhaar_card_Varsha_Soni.jpg	image/jpeg	245000	57a75ede2aefe95a3a0eae40c08548f965a24595a4fdb45babb708609417f951	2026-08-24 11:37:47.655	2026-08-24 11:37:47.655	\N	\N	\N	\N	\N
a5fecff6-78bd-420c-ba8a-b63eb322981e	43407c0f-7501-4119-ae47-542249d573c9	demo_doc_174.jpg	aadhaar_card_Yogita_Raval.jpg	image/jpeg	245000	52fe5071a8fe48a9599840c427ebbbe2c1f55354692dd26890c640a32ec0f714	2026-08-24 11:37:47.662	2026-08-24 11:37:47.662	\N	\N	\N	\N	\N
a58c003c-16a6-4475-ba47-0a1599d30566	bd835c77-4c61-43ae-baba-7e142bb64ca1	demo_doc_175.jpg	aadhaar_card_Zarna_Goswami.jpg	image/jpeg	245000	a59ba624ff7752a3e7952eb7de47611122f03f47101a75092d6b4e36eceb021e	2026-08-24 11:37:47.67	2026-08-24 11:37:47.67	\N	\N	\N	\N	\N
531990fe-0ae1-468e-b364-220c528ab06c	659fff5b-eea9-4456-a742-d308d7582997	demo_doc_176.jpg	aadhaar_card_Amrita_Purohit.jpg	image/jpeg	245000	d1cc5e43d1701fae6a4ffbbd6b69e0e2940a1565557125c5e788fdade9092ab3	2026-08-24 11:37:47.679	2026-08-24 11:37:47.679	\N	\N	\N	\N	\N
8e00c3cd-b95a-4c2e-8427-20cf04ff89fd	534dee14-0e40-42c6-a6af-5facad252786	demo_doc_177.jpg	aadhaar_card_Binal_Thakkar.jpg	image/jpeg	245000	c194f1f3f26a8b39ce541637a11d63adf77eaf2f02626d543cdc594a6274af80	2026-08-24 11:37:47.688	2026-08-24 11:37:47.688	\N	\N	\N	\N	\N
249783d3-b70b-49c8-a365-942409032cdd	587bcf6c-4ca6-43f7-a153-1e6529d0ca82	demo_doc_178.jpg	aadhaar_card_Chhaya_Modi.jpg	image/jpeg	245000	fabcf1d3766ebe5ef3d70192e0a65a1b6cb9f6b6cb2a6eeb96acd4b487fdbf42	2026-08-24 11:37:47.698	2026-08-24 11:37:47.698	\N	\N	\N	\N	\N
f2c88de9-77d0-4ede-aec8-a6a7f2fea9ec	3abb916e-76ab-46dd-997c-35af38863bad	demo_doc_179.jpg	aadhaar_card_Ananya_Sharma.jpg	image/jpeg	245000	65572ce8bde2263cd34281adcd24dbb1927d480d806f4c4b6ab588487539cb29	2026-08-24 11:37:47.706	2026-08-24 11:37:47.706	\N	\N	\N	\N	\N
d281e71b-514b-4d73-8dfc-c65d607b80f6	f32789c5-207c-4b6d-a934-a5e8a36fe02f	demo_doc_180.jpg	aadhaar_card_Riya_Patel.jpg	image/jpeg	245000	1217945c52375971f916b2c39d1df23944b51afb3349c86525daaa8c3d7b74c2	2026-08-24 11:37:47.714	2026-08-24 11:37:47.714	\N	\N	\N	\N	\N
618722ab-8f9f-4bc5-a866-14647aff597d	dc303dd0-7af4-4006-adfb-3c8fc5225686	demo_doc_181.jpg	aadhaar_card_Pooja_Joshi.jpg	image/jpeg	245000	693690c9958bbf6f304dcc886170ad5827cca8dbb46cc3874e6e383ec0604824	2026-08-24 11:37:47.721	2026-08-24 11:37:47.721	\N	\N	\N	\N	\N
95110e91-cfec-4252-a042-97c58b39db13	ac0a5044-a1df-4f0a-8a4d-ffdf06dc6f81	demo_doc_182.jpg	aadhaar_card_Diya_Trivedi.jpg	image/jpeg	245000	99dcb6ef488f181f28a29f5d499207d4af57fbd6d455c51b97b60e0751eae274	2026-08-24 11:37:47.73	2026-08-24 11:37:47.73	\N	\N	\N	\N	\N
6f7889e2-1496-410f-a4e0-280844f7f5a7	bcf8c33b-19a9-4b5d-bb2f-bb08dcde5258	demo_doc_183.jpg	aadhaar_card_Kavya_Desai.jpg	image/jpeg	245000	4b751afeb47c6862110cbd6325756b52b90191a0c3363a3d1196fdb71bd4173d	2026-08-24 11:37:47.738	2026-08-24 11:37:47.738	\N	\N	\N	\N	\N
6e71cbcb-eb91-484a-bfb9-dc1daf062934	a954ceb8-6cd9-48b9-8573-1ee095669cfb	demo_doc_184.jpg	aadhaar_card_Ishita_Shah.jpg	image/jpeg	245000	bef9262731f11bcea091b44bd22df7f84f6ae21a67334fd85a1370a6c4b1fc39	2026-08-24 11:37:47.747	2026-08-24 11:37:47.747	\N	\N	\N	\N	\N
8411a932-7b6f-4be1-b08a-43dadce6c192	a0d51f7f-b57c-45e1-9556-77f980173dd4	demo_doc_185.jpg	aadhaar_card_Tanvi_Mehta.jpg	image/jpeg	245000	70c542e40e9329c8506ccd02e0f12445186fbfb3cc963c3be7d1a09022632528	2026-08-24 11:37:47.756	2026-08-24 11:37:47.756	\N	\N	\N	\N	\N
c664ca9d-b345-4b87-af66-f3c0e69051f0	f9c21b0d-3b37-41ea-9eed-abaa56641bc7	demo_doc_186.jpg	aadhaar_card_Niyati_Bhatt.jpg	image/jpeg	245000	964d547d5e716c3327b21debb9af26f3e1106d0e4fdcf02d3b71f8e6d3140107	2026-08-24 11:37:47.767	2026-08-24 11:37:47.767	\N	\N	\N	\N	\N
3545ee49-1e3f-49ad-a7de-ceab17dc83a3	2332f686-814d-494d-846c-80b60febe3cb	demo_doc_187.jpg	aadhaar_card_Avani_Dave.jpg	image/jpeg	245000	bdfe3db8913a0d6d889c93fe3efb600c33d9993b8995011d35f99d740e51474a	2026-08-24 11:37:47.776	2026-08-24 11:37:47.776	\N	\N	\N	\N	\N
405e5107-363b-488a-bb52-bcfb23d7a986	d4e5d3d9-2c89-4f23-8b45-76461c1c5abf	demo_doc_188.jpg	aadhaar_card_Sneha_Vora.jpg	image/jpeg	245000	dd01417bd4056fc6e249d93c204b43ddd9d65a7b9a97e809d5fa8e2e4d262c9b	2026-08-24 11:37:47.785	2026-08-24 11:37:47.785	\N	\N	\N	\N	\N
1035bb8c-feaf-472f-82c1-a940b7a6fbef	47880a79-041d-464f-a931-51629cca3436	demo_doc_189.jpg	aadhaar_card_Khushi_Parikh.jpg	image/jpeg	245000	c18ee1f7a5c152ed03343794d82f110c7046e48a724efe75955e27501a22ec22	2026-08-24 11:37:47.793	2026-08-24 11:37:47.793	\N	\N	\N	\N	\N
2b662043-1c9e-4d2d-b52d-1c4dafc92db1	402e1e33-6231-41d3-92a6-24496141fa00	demo_doc_190.jpg	aadhaar_card_Radhika_Vyas.jpg	image/jpeg	245000	1758e371621254ad84ebc5ef64b6187af2eca5f782bb0e3e959c4ee025753ef9	2026-08-24 11:37:47.803	2026-08-24 11:37:47.803	\N	\N	\N	\N	\N
5ee392bd-1088-452e-b8a1-39fe88dd637e	6d78dbbf-e7af-44c1-9072-15de3b1588e7	demo_doc_191.jpg	aadhaar_card_Bhavna_Rathod.jpg	image/jpeg	245000	b8f44369b3c8e017de41facc855bf577852837f1591b3f89ac1bc5953409f316	2026-08-24 11:37:47.811	2026-08-24 11:37:47.811	\N	\N	\N	\N	\N
0501895c-e8b4-4335-a382-af8cfb683c14	2636f682-fafb-413f-ad2a-3cf85d8a8d13	demo_doc_192.jpg	aadhaar_card_Priyanka_Shukla.jpg	image/jpeg	245000	14f14af12896bcb268dacbfadcdd5ec17ae4e55a637c055724a4d16575810dbe	2026-08-24 11:37:47.819	2026-08-24 11:37:47.819	\N	\N	\N	\N	\N
0b60ea91-fcc0-4680-9a94-8d029c733d43	6aa15961-4706-45fb-9610-77eebdc5c577	demo_doc_193.jpg	aadhaar_card_Drashti_Zala.jpg	image/jpeg	245000	a661b6d06a0e4224c1457d7a1245a9109acd64a7598a0e3849aec2ae7de0874c	2026-08-24 11:37:47.828	2026-08-24 11:37:47.828	\N	\N	\N	\N	\N
670116f2-3275-46fa-89d3-10b262d092ad	6a1d38b5-06dc-4112-86bd-97561d6c474e	demo_doc_194.jpg	aadhaar_card_Meera_Panchal.jpg	image/jpeg	245000	366e19f55de665d9b9089ad022121310eb25429c9972c86344c304bcc87201d8	2026-08-24 11:37:47.838	2026-08-24 11:37:47.838	\N	\N	\N	\N	\N
35c83457-c17e-4cbf-8861-9ea8b426db9e	e53d9ebc-d012-42ee-b9ff-1c2e37918936	demo_doc_195.jpg	aadhaar_card_Krutika_Chauhan.jpg	image/jpeg	245000	975b63a8ba1d92d3191a3c9e7802954d69fd04c30dbf9ea9bee5db0b2581129f	2026-08-24 11:37:47.848	2026-08-24 11:37:47.848	\N	\N	\N	\N	\N
b5825b69-6f0b-4f7e-b555-3798feb152ae	454ae142-f647-4335-956c-03b247aed2ba	demo_doc_196.jpg	aadhaar_card_Kinjal_Gandhi.jpg	image/jpeg	245000	2d8348a83e9548990be8c6d461424b5fa56e1b4909e1a657688ebe7bf8d7d75a	2026-08-24 11:37:47.856	2026-08-24 11:37:47.856	\N	\N	\N	\N	\N
e06a8c49-e3b2-41fe-b711-1f855a4cedfb	8579cf1c-a557-4471-b315-d8c6fc7d9f4e	demo_doc_197.jpg	aadhaar_card_Jhanvi_Rawal.jpg	image/jpeg	245000	51bb211535d4b6be437850ed72219a7af4ebcfbde0692351bbf6b14457531798	2026-08-24 11:37:47.864	2026-08-24 11:37:47.864	\N	\N	\N	\N	\N
8b233b80-6008-4a25-a56f-1086a81cdc81	bd665a05-6a92-4efd-85dc-f68706d31455	demo_doc_198.jpg	aadhaar_card_Kiran_Patel.jpg	image/jpeg	245000	7468810aa53ed4310e99768fbb6e5bbba1a3ef52cdb50a30c9d74c5349978ffe	2026-08-24 11:37:47.875	2026-08-24 11:37:47.875	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Attendee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendee" (id, "fullName", phone, email, gender, "aadhaarHmac", "aadhaarMasked", "aadhaarEncrypted", "createdAt", "updatedAt", "kidsAgeGroup", dob) FROM stdin;
76843426-6af2-4b19-8f0d-5367d65e34eb	aaaaa	+911111111111	\N	FEMALE	4b09804d672f255563c7891dc378449d0477c0df3caa8e9db7d245316ba4853c	XXXX XXXX 1111	cc0bc4e12c970b4be1c1eeb8406178d8:88eeaabeba28ebd633c8ffa6145d5850:6c611caa906e0cdc15cf3935	2026-08-24 11:40:30.756	2026-08-24 11:40:30.756	BELOW_10	2015-08-18 00:00:00
964b84a6-ad92-4b5b-bbfd-e22961b63ef0	bbbbbbb	+911111111111	\N	MALE	74b206de2235f29cca571db509dec42957daf182ecd52e5a7f4d4f6f7deb84e0	XXXX XXXX 2222	b1a4b25e5ed7a3df3e18c2cc18c27fff:f18928bb743d0bb70cbaeddaa252b50c:b0ac2aac4c4eec5bc1ed8af2	2026-08-24 11:40:30.77	2026-08-24 11:40:30.77	BELOW_10	2025-08-13 00:00:00
b89062d8-95b2-4dc8-ac56-6916a0af4c1e	Ananya Sharma	+919876510101	ananyasharma101@example.com	FEMALE	3b175388fa18133332d1a2210630558b68e6171a62c9491c4d1395304084ec91	XXXX XXXX 0101	c21656fac528bd06dc5bcdf9336be815:90958ed42748c9c9e6ad0716e0888722:2171c8d22964d912392293e0	2026-08-24 11:37:46.682	2026-08-24 11:37:46.682	\N	\N
5a64017a-6a57-4f7e-a882-2fdc4c315983	Riya Patel	+919876510102	riyapatel102@example.com	FEMALE	da7d266a0667974549a0dbffb4fe02e92fb9881f89a8186e418bb8b9527034cd	XXXX XXXX 0102	29befdb6942d68b4161d9823419970dc:8f8d6eeede5f6b1ff6d647a61ca090cb:134aeb161a9c99c51eacb054	2026-08-24 11:37:46.707	2026-08-24 11:37:46.707	\N	\N
9b929bd7-324d-4eea-b179-396104fab46d	Pooja Joshi	+919876510103	poojajoshi103@example.com	FEMALE	83453741e20bad859fefb52746d1114a25ce3dbfd60257c97e261613e20296b8	XXXX XXXX 0103	98ea1e9c6c31cf0990f4632a80c8ca19:82a9b630d8b6f675a3804584a754d986:0c203726510349da8a3d8c99	2026-08-24 11:37:46.72	2026-08-24 11:37:46.72	\N	\N
6c4040dc-a35c-48b6-b023-91e714ea266f	Diya Trivedi	+919876510104	diyatrivedi104@example.com	FEMALE	26e5085156ee4975935afe6574fca05a2841be0a792761b077a12b217903af40	XXXX XXXX 0104	9e8a9ac0cf3a0b5be4142ff955153eec:e2d0b3e8e0ec0c447f764683a88e6b31:b92110b42da315f9717a624a	2026-08-24 11:37:46.751	2026-08-24 11:37:46.751	\N	\N
1b81be44-7216-464f-8ba6-f81359acd345	Kavya Desai	+919876510105	kavyadesai105@example.com	FEMALE	752bbb2d8b1a904ad3b0c298cdc5c58e6a3649647bd3ef2d0ba731925eb03f2a	XXXX XXXX 0105	84bf845ab654bf083eb05f85a054752c:65083d5be6ecd3de4738eaaada5ce776:5163261a8f77e1eae6b29f34	2026-08-24 11:37:46.769	2026-08-24 11:37:46.769	\N	\N
6b5e9370-6196-4c44-8ddb-d6d80ba4ad29	Ishita Shah	+919876510106	ishitashah106@example.com	FEMALE	d017a8fd23e0fbb6243295e5c718ba9a95f66922e43d677c152f34b5dceeafff	XXXX XXXX 0106	3004dd75ef42bec38b59c1b65a75cf21:4d20106ab39727eaf53804f631975502:2d678fde45b3c727ebd6eb74	2026-08-24 11:37:46.79	2026-08-24 11:37:46.79	\N	\N
aa9e6fff-daba-4bfc-8ed9-98b32ff086a9	Tanvi Mehta	+919876510107	tanvimehta107@example.com	FEMALE	65bc7cb4f5ef84f074410cd773742e1f2c9e75252fe4bf3861324e9718e60c1a	XXXX XXXX 0107	aa6f8a4ab0488788084da598c8799e44:6bb1e504b5f14c6c3a077b6fbc44022a:16c246ee2858ee4d8cb126b6	2026-08-24 11:37:46.807	2026-08-24 11:37:46.807	\N	\N
373c58f8-e659-435a-b40e-1d055b0533ca	Niyati Bhatt	+919876510108	niyatibhatt108@example.com	FEMALE	e2dc78099f36559462a42107b1d5c6b96c8cfb60ba167db711acaa2ceb97abd7	XXXX XXXX 0108	789351a652e623fde2bb43eddf16f06c:1c7e671eb1bec40b0b0e48bf515a1096:4f53a755c017ddaa157054e2	2026-08-24 11:37:46.822	2026-08-24 11:37:46.822	\N	\N
10ea55b6-0309-4988-8d2c-2229e3176707	Avani Dave	+919876510109	avanidave109@example.com	FEMALE	ce22b040c13cf7fc0f478026199940be756c7455d3aad0a4bea0aa33630ab468	XXXX XXXX 0109	69bf7272ffc2c182eeb85de86b92d458:728e046721eae9ec6aa06e3fffdd51df:5145882275e71baecac8e960	2026-08-24 11:37:46.835	2026-08-24 11:37:46.835	\N	\N
69316941-f21f-4385-95a6-0348b7befb3b	Sneha Vora	+919876510110	snehavora110@example.com	FEMALE	92f153d042b44a03c4e41a887ee2a307c606f118e1b3941af3d2bbe4f9db24a5	XXXX XXXX 0110	8591f2a90c02bbe57af36c5313891967:ab28b312e5ae07e10cc34721ce2342ac:ddfdbb430d0bdeb8a447220c	2026-08-24 11:37:46.853	2026-08-24 11:37:46.853	\N	\N
4a3f4b26-47cf-4a5e-afb1-2dcbf19d06b9	Khushi Parikh	+919876510111	khushiparikh111@example.com	FEMALE	f74cf3f692e2c2303b90242fcf898145f1dc31af6df18778d68ee08fa2a68bf9	XXXX XXXX 0111	ee66c2b258f6342f469e89dd02ab5436:7b33910264954f2db6abea3f2afe02d9:afeb9c4acf260f0ad2b4edda	2026-08-24 11:37:46.867	2026-08-24 11:37:46.867	\N	\N
c1608127-72a9-47b3-bc61-52d83b14c7a3	Radhika Vyas	+919876510112	radhikavyas112@example.com	FEMALE	db362772df99fe6e8eaeac10f8d701e9480cf5fbede0988425a18d5829c897a9	XXXX XXXX 0112	79c3ead42794c54b08c6359a975ef64e:7963ed619a2ed3990f53ec36241268a3:c571e427770ffc69436229e2	2026-08-24 11:37:46.883	2026-08-24 11:37:46.883	\N	\N
f242dc20-c343-443e-a234-ecdaaff1ddc1	Bhavna Rathod	+919876510113	bhavnarathod113@example.com	FEMALE	e9389944489b1f8a91cfcef512cf248c6e3b9ac0d377ae4b5b5e8e5dcfefee41	XXXX XXXX 0113	6a6d5ea7455f16dc6cbe99adb43ef107:1321fdbb7c7c9d88af6b0573dcd6cba3:c3bc6509c7f6e88bb6369f98	2026-08-24 11:37:46.9	2026-08-24 11:37:46.9	\N	\N
b15e392a-86a4-4808-843c-e501dd83ed02	Priyanka Shukla	+919876510114	priyankashukla114@example.com	FEMALE	12b48e1884527a7e611a16ae7bad26e216a92d1ce4a13384ac33629b16970122	XXXX XXXX 0114	ab7b41b645281bf4d7ee4ded84cf83aa:09a976faed52db47ed45382f3074b094:2716467b571a44c52a2b632c	2026-08-24 11:37:46.916	2026-08-24 11:37:46.916	\N	\N
7affed51-2c81-48b1-b122-5be6a8081ce1	Drashti Zala	+919876510115	drashtizala115@example.com	FEMALE	a7fef89af87b5abd017652b3825c14fec74aa06dfd6bc51ad349c37b28178fd7	XXXX XXXX 0115	c339a7b9d55a449e27ae3e80b0dc4194:5583511758f1cc6741e84a493b35aaab:f260d3e6c2e71e49d0186f19	2026-08-24 11:37:46.933	2026-08-24 11:37:46.933	\N	\N
488cf082-8c88-47a9-86f9-efdb0e777962	Meera Panchal	+919876510116	meerapanchal116@example.com	FEMALE	5af3fe50ce8cc95393e49b684d699f8529fdbe6121f14cd2c4f650d8f17344cc	XXXX XXXX 0116	e45100b82a0327b466045e5da5e7b10f:7564e1d6a1d76fc2eb5b7ff79267e3e8:2fe16bb8bcd00b57396a4a32	2026-08-24 11:37:46.947	2026-08-24 11:37:46.947	\N	\N
145b95ec-8cb4-4136-ba94-d5c1487098f7	Krutika Chauhan	+919876510117	krutikachauhan117@example.com	FEMALE	e1c0e1e7dcd03aa1469df9764a5fdf654bc0f707e69c00d4dbb6d77e000829a9	XXXX XXXX 0117	d6f68cfc976cf2541e137c50586acb60:a96dd3c484a17d8f103364e10ec34d36:b91423d8cc6c33b86ffef1ca	2026-08-24 11:37:46.974	2026-08-24 11:37:46.974	\N	\N
6edbf979-570c-48b8-84a7-25b55b92d096	Kinjal Gandhi	+919876510118	kinjalgandhi118@example.com	FEMALE	933277cccc5d4fbd9b2711417cfd73945d90ca74b2fcaa8b1f43ecf149df4392	XXXX XXXX 0118	e488f1d8ca7a1f1c1dfb73be0051a4eb:c8db390eb004d2cdbd5b87a59ef44c68:deb93169ca53c423b1915bde	2026-08-24 11:37:46.995	2026-08-24 11:37:46.995	\N	\N
62aeff75-3276-46e7-b801-0a7b6088d853	Jhanvi Rawal	+919876510119	jhanvirawal119@example.com	FEMALE	ed6ab7e5279c7c7faf61a8a18c1a3f4077dc72ae821c00c6c9934c941682264b	XXXX XXXX 0119	1b6daeffb88608a577194c73f9b7b1e2:f76eb314bdf65432a1eafdc374554097:38d05ccc3d1a9453c67d7587	2026-08-24 11:37:47.016	2026-08-24 11:37:47.016	\N	\N
0eecd093-e618-47c1-b1f5-11589ee16f53	Kiran Patel	+919876510120	kiranpatel120@example.com	FEMALE	258bfc2cf90c365b70d9720c84c0dea53e185ec8e0e90cc329d7d77fdd519ec0	XXXX XXXX 0120	b8967c15a81f4a14384d2345297ee048:f0bfbb6660fec7ef4dc6e6e048a12522:0869a108d3dcba8076b28483	2026-08-24 11:37:47.035	2026-08-24 11:37:47.035	\N	\N
6546d88b-437d-45fd-a292-d428351d29de	Hetal Soni	+919876510121	hetalsoni121@example.com	FEMALE	f6740a1d2514177b9729a5ce5aeefba06bcde8788e7cdcfc0cf6d98fbd50a245	XXXX XXXX 0121	7ec4f839a3e81753f30424f169c547a0:17017bb0275621d345bee96164fd068a:08ab838dabb3768f7b87bef7	2026-08-24 11:37:47.057	2026-08-24 11:37:47.057	\N	\N
263f5594-8f8a-41e3-a641-20b57a0f0c9d	Swati Raval	+919876510122	swatiraval122@example.com	FEMALE	c4465020eaa343a76acd6e79f9e7058e523d48ed16c4ce4e8f1b99dcc556031b	XXXX XXXX 0122	41ebf8f24dd319dd3cb6c129ff9d2041:aec0bee763cfe4d51e6c178bf3078903:63e4f54f8ebb425d822bbc8f	2026-08-24 11:37:47.076	2026-08-24 11:37:47.076	\N	\N
80ce788d-afb5-4f40-b72f-dd5cde663f1b	Bhoomi Goswami	+919876510123	bhoomigoswami123@example.com	FEMALE	4a1b23cfe70d8b4125c16d8d32b6f4d6f1328ff42fe6f8826262c7f47a7252ae	XXXX XXXX 0123	813b3a16d7b84c116e2beae9bc578eef:827f9d7bc88172fff7345b5b2181b5d1:f56e9c85fc9e4f19355cc57c	2026-08-24 11:37:47.095	2026-08-24 11:37:47.095	\N	\N
d827e489-a44a-4efe-aea4-8974c180c18d	Shreya Purohit	+919876510124	shreyapurohit124@example.com	FEMALE	b20358a442e3a57cb3fb3028a19a4c6fc3c45a4137c8f3e07338d77ae012bae4	XXXX XXXX 0124	b2abca5f40e85e3969e7c73afa1efa25:045afe99f8c058d4843e70034832f5cc:e03bf40efe8f29593b3a638a	2026-08-24 11:37:47.116	2026-08-24 11:37:47.116	\N	\N
0a3f73ec-d434-4e82-bc23-1589b7cada50	Vidhi Thakkar	+919876510125	vidhithakkar125@example.com	FEMALE	b1f3a2b14e5c0a376d6047bc8b477ec06e08dc59fc67abec2fa9b5437a6b8bca	XXXX XXXX 0125	01b12c3a2aa6f9c30ed5308dc9f5cac5:26b7ae7b6497239f00a6ba62be9b658e:2701b9d57c921a5231be97df	2026-08-24 11:37:47.136	2026-08-24 11:37:47.136	\N	\N
d866f99d-317d-440d-8160-78614bae9b70	Jiya Modi	+919876510126	jiyamodi126@example.com	FEMALE	0418754d8f667f85ab099d672d9e2ea402a75092cd83a58e0a6ea40c0e0c0a66	XXXX XXXX 1261	872910b9d93566b7aba198fac8aceba1:e0880713c5998e078f33655931daf53d:93d002abf5e8f21142650ab8	2026-08-24 11:37:47.157	2026-08-24 11:37:47.157	\N	\N
8822bea3-95db-4ddd-9a04-34273b7ad6e3	Rahul Mehta	+919876520126	rahulmehta127@example.com	MALE	e59de392f21f6fc6e114f57324383d88b7a7e0d054f8689934962a6b248e3fa0	XXXX XXXX 1262	92d559621981a4d2387c71863a52b6b6:df52a546a7beb8f09dabb10e84c83fb3:e24abeb5a5471ff5ddddd853	2026-08-24 11:37:47.161	2026-08-24 11:37:47.161	\N	\N
59a1cf1f-9a0b-425e-8917-8cd5e20951b8	Rupal Barot	+919876510127	rupalbarot128@example.com	FEMALE	d944d6e933e3f52bbf6e375ef53ff230b90be062df5eb0b51a19b13e74375ce4	XXXX XXXX 1271	0b1a42009a1fa5bc154dd6b2a45590a8:48c4d2720c9067b0617eea5cf2df9e24:96732e28a4d4660703095af7	2026-08-24 11:37:47.178	2026-08-24 11:37:47.178	\N	\N
acb3fc34-51aa-428b-9b32-1e5c51fa79a1	Aakash Patel	+919876520127	aakashpatel129@example.com	MALE	d7bc0a8c699a3ea03264d183566b41c1f0de63dc5904a431ca0d0727475ac47c	XXXX XXXX 1272	72d4d28813a2bcc1f59abed537313f47:7995e671d4ef92f3016fe50386386a04:ae8e16b152d1ce7dd71cbe54	2026-08-24 11:37:47.182	2026-08-24 11:37:47.182	\N	\N
0a5e5647-1b01-484b-8255-8aa5c44b8352	Purvi Pandya	+919876510128	purvipandya130@example.com	FEMALE	0792390d9998bdd8009bb170e720bf7f35fe7eaffdf1ff742f5ff79667038712	XXXX XXXX 1281	3a276164f3cfbdc79d5a2ca11d9589aa:fa1c4b830d4d65a4371b01dc61c423f7:53b1c5544243cb7c91a1cf2d	2026-08-24 11:37:47.201	2026-08-24 11:37:47.201	\N	\N
af7f879d-d231-4c32-9541-1c211c502f38	Rohan Shah	+919876520128	rohanshah131@example.com	MALE	128a6cef4a1a1b70ded01f44c2e0a0b22c82c74ec61cdc0e05d45c2ebbef77bc	XXXX XXXX 1282	7c59fd59b672f9c53fd42cf41c064e4a:1cf4c5849972038f9ed494b3785443cc:9552d7e0c5dfd7018fd695f6	2026-08-24 11:37:47.209	2026-08-24 11:37:47.209	\N	\N
96461f20-d533-400a-aa08-0a622e429d51	Krupa Solanki	+919876510129	krupasolanki132@example.com	FEMALE	f53dea0dda1aa142c818c1296df3ec2e9ca531e5d2deff3bfd73273b9cff8709	XXXX XXXX 1291	0deeecac388c1244eb540bb37bad28c2:87550a80d153b5691ccebf9d07072fac:bf532537b81da06ad9c73ba2	2026-08-24 11:37:47.227	2026-08-24 11:37:47.227	\N	\N
d60e8660-8f36-4409-8a1f-278aa2e7e543	Aditya Joshi	+919876520129	adityajoshi133@example.com	MALE	f4dcb7a78830cf67af16fe0f141e2d53bc8ae2a94a9de1a21907d1343133f7b8	XXXX XXXX 1292	97905a77a7b347af8dfdd36af457d553:6daf964e87622655f63352394081fd00:99f76b2f78d056c465844c95	2026-08-24 11:37:47.23	2026-08-24 11:37:47.23	\N	\N
e6cdca11-225a-4ebb-a155-3fd14d4f7c47	Mansi Kotak	+919876510130	mansikotak134@example.com	FEMALE	1062604245b8e3c37802c145288a13636b5860973ac171f0c80808603562683e	XXXX XXXX 1301	f7ee96263bd69346b778eb0769b4e3b0:80bee62bed8d8971fbf1c7aa4186daba:c255c6a640557f45474c2da7	2026-08-24 11:37:47.247	2026-08-24 11:37:47.247	\N	\N
f78e9a40-a66c-40dd-8cca-505317ed6404	Kunal Trivedi	+919876520130	kunaltrivedi135@example.com	MALE	6681a14d8406f02410943af0bffb6fece3ace5d21a924bab62866d6906a07089	XXXX XXXX 1302	646f818c3fa6f318d1673d7e660e4916:262585fbcd1ccebeb6acb7a086364510:ed217c38740ec20ec97f0842	2026-08-24 11:37:47.25	2026-08-24 11:37:47.25	\N	\N
66d3185f-c890-4600-8ea9-0e6ae7d67c37	Isha Kapadia	+919876510131	ishakapadia136@example.com	FEMALE	18fc6e476201f1ef6f94847c284aa9f00c1f5c234500ceacbaaa9a6a5896c3cd	XXXX XXXX 1311	8129a4e7557c3122e500c2eb844cda80:16d1b727b9aea0c7d3f6ee15331a58fe:0eab71e9642db1cf8fdcd1e6	2026-08-24 11:37:47.269	2026-08-24 11:37:47.269	\N	\N
72aa7d48-17b8-485e-a3e1-f280f0121226	Harsh Desai	+919876520131	harshdesai137@example.com	MALE	7fd4f6218c5fa03f9c6c8ef21f7eef687ce28be5cc53c8a8f6ae1277a089dc42	XXXX XXXX 1312	da23e53158310c5f2fa231eb1ee94c57:dd745c6a66c6998ffc5a0fda7aa7e464:9d11cced0e9bf60f767441c3	2026-08-24 11:37:47.274	2026-08-24 11:37:47.274	\N	\N
c369821a-c8b8-42cd-b25c-57f3f4c6787b	Nidhi Sanghavi	+919876510132	nidhisanghavi138@example.com	FEMALE	f0023b767b017c20ab284a69d5651256eeacc415ed4b1dea1d2f11ef0d16b669	XXXX XXXX 1321	523342632aff25ae6620e5a6cecefe78:b8c004f7a90a1fc38fd670b0824267ca:2897c709f006c7c69f22d795	2026-08-24 11:37:47.296	2026-08-24 11:37:47.296	\N	\N
8a9f1fe1-c092-4415-a400-ee6825a65b62	Siddharth Dave	+919876520132	siddharthdave139@example.com	MALE	8e62e40aaf91bdf062b4669d70ebbd94d95df58808421c56b0e5f0b8b1415027	XXXX XXXX 1322	e853818e840da2e02bedab21bd2f6fc4:3a6ed6c30952b7ff50fcff4ab21be160:0b958880961643deb9e069ea	2026-08-24 11:37:47.3	2026-08-24 11:37:47.3	\N	\N
8a43ed2e-3a93-4ef1-bb51-2d3f8ddac193	Palak Dave	+919876510133	palakdave140@example.com	FEMALE	463e8f4be69462505a5b805aefe380418e2d8c4ef60b7f608fd68dccbbcb9320	XXXX XXXX 1331	1d370d159456a05fbfadc9c9d1d223bf:85da2b52fae94b7eb92a3a8a03d4f1fa:59594d1194583ed07a57db3b	2026-08-24 11:37:47.318	2026-08-24 11:37:47.318	\N	\N
6c9c3ecb-c5f2-4be4-8b86-3231e4281d8e	Yash Vora	+919876520133	yashvora141@example.com	MALE	cb2ac6f44203f3e1cd1fd029eb7a201eb6cec01dbacc901b8b9b503ed65e88de	XXXX XXXX 1332	912ad34565b32644ac681873a75f149a:3522ca0f63ba7612f5aa834548ee7052:99323b4f571d27e92234dec8	2026-08-24 11:37:47.327	2026-08-24 11:37:47.327	\N	\N
0d823321-e69a-4f1e-896f-e4400b984546	Komal Shah	+919876510134	komalshah142@example.com	FEMALE	ff60435fe5b167c5c00abe91cee1d765ad7f3261aae7449c56a01fe8d5432f0a	XXXX XXXX 1341	b06cd73ae34165ee09a32c6b74b48403:0f5a6bf4077aea098e443949fb5f4c92:3eca9574bf8657d0cb78fc5b	2026-08-24 11:37:47.347	2026-08-24 11:37:47.347	\N	\N
39301089-3e6e-42e7-a25d-28d692f03051	Parth Bhatt	+919876520134	parthbhatt143@example.com	MALE	bb7c6ecd5e6bec84b4bb6e359374df26e39fd08e4e64cc4c67c970005fd11b81	XXXX XXXX 1342	dbb44bbdacee5758ab399cb9f351cc57:83346653c83107cef5e40fbcf6b3b402:bb6b87c359ee5bce02656c7f	2026-08-24 11:37:47.352	2026-08-24 11:37:47.352	\N	\N
a0b0dfb3-3bef-4dd7-9386-6942e884b223	Aarohi Mehta	+919876510135	aarohimehta144@example.com	FEMALE	53db21294b0d42fc013e78ab8560a0e411420fe19266d333403b5f326dcc7293	XXXX XXXX 1351	f38530c99dae218cd17c1f8dfebbe4c5:542aa0d1e015732e8f84ec2a81b2056a:04f408650860805a2ed63e18	2026-08-24 11:37:47.373	2026-08-24 11:37:47.373	\N	\N
88511bf3-a7d7-4318-b9c7-64b13b36ba40	Devang Parikh	+919876520135	devangparikh145@example.com	MALE	e709f7040688518a226c1fd1241fef7adb832e390e3bdd69c9569cf32b824679	XXXX XXXX 1352	3da21c481e4b43f523e6be40337db709:a4e038b9fe60dda0925adcdb9202007e:ac6bf2dfe071d650b4823fb8	2026-08-24 11:37:47.377	2026-08-24 11:37:47.377	\N	\N
74dfe834-aea0-4442-82cd-15faf9943dc5	Krishna Patel	+919876510136	krishnapatel146@example.com	FEMALE	110bb653e8dd702217857156e2478d332944e6db76aa72e171509150ed1bdc4c	XXXX XXXX 1361	6dfa58bbae0d0710a8ed63b2705109cc:ea642ced40b2130d48feddeedb05c3d4:efc503233548ef3643e92ad1	2026-08-24 11:37:47.396	2026-08-24 11:37:47.396	\N	\N
71288b58-62d4-4cae-9d89-83e3fc91aca6	Manan Vyas	+919876520136	mananvyas147@example.com	MALE	50e7479ff8b64ab8314e5549a5b44bb8a815f631db0ec43bf624496ed6d06cf7	XXXX XXXX 1362	3f3b9a7f64362423be41f06c84ed2906:6f9ccd2a94ebd3b09267af25c1875e6d:a1edc0a22750cd06b1428c42	2026-08-24 11:37:47.4	2026-08-24 11:37:47.4	\N	\N
9b873340-d10d-4465-ba60-c8831b17a3b7	Devanshi Trivedi	+919876510137	devanshitrivedi148@example.com	FEMALE	9f2e502eb154d2574cd420d22078493e729603b9ef98c66c76650817bfddeb9b	XXXX XXXX 1371	46fd0d7145d56fe868c8dad80e1f20f4:468f84829031b3477045e43597ee764c:101bfd984d1cce7de7b914bb	2026-08-24 11:37:47.422	2026-08-24 11:37:47.422	\N	\N
a72eadd7-7e2d-4c20-8adf-be2a27df1140	Neel Rathod	+919876520137	neelrathod149@example.com	MALE	9e0a1d2d61dfab0a846979b76b2f31a33391402004e4b774bc14550bc5ab13d5	XXXX XXXX 1372	4ecc8c3dfdf4339e8f56ec65fee0acc2:4c269f5db47e7ffca1f77c9a78f33573:95100af5cadcc3b094370b03	2026-08-24 11:37:47.427	2026-08-24 11:37:47.427	\N	\N
6b939f39-a109-4ed4-b8f9-5f9cfc782ea3	Gopi Joshi	+919876530137	gopijoshi150@example.com	FEMALE	0bc7d191f383f470bfe364e254f7e3826856c8ec6dd17a88f2712c61784c86c7	XXXX XXXX 1373	dba33a843725909b284c9e98abaa97a6:ec0d4a44cc9adcb7105bd5394c45ac31:511214b4d93f42734aa5300d	2026-08-24 11:37:47.432	2026-08-24 11:37:47.432	\N	\N
c8b2ca97-28f0-46e8-acb2-65babbe0b84a	Payal Vaghela	+919876510138	payalvaghela151@example.com	FEMALE	6c7a1ae7548acddd784f488852cd6ea7fa873dce3844f41b33c866b5d684769d	XXXX XXXX 1381	95ec8209ebf724c81bda5dea09555840:365df4036c03f1702c68599f348da191:9e12cfc68e2379f7c8f59891	2026-08-24 11:37:47.458	2026-08-24 11:37:47.458	\N	\N
91d0d488-6f35-4b85-ba4a-1ed4411a7e0b	Tirth Shukla	+919876520138	tirthshukla152@example.com	MALE	4f024cfe285a23e9272e93c5ad24e4c4b2af1467bd09aa6de5c236a877331749	XXXX XXXX 1382	438a3b78b30efb35fce6ecf46aadfd5b:a257b07790cdca1c9668c4ab0625e053:2dfb1eccb6afd461848534b5	2026-08-24 11:37:47.463	2026-08-24 11:37:47.463	\N	\N
19ca0bb7-3514-4a5e-a047-83d383bab26b	Shweta Acharya	+919876530138	shwetaacharya153@example.com	FEMALE	9bf17e14b1280d5633576e54a124ce8299e40b0a48ffb5dc989a8db5819ccd7a	XXXX XXXX 1383	7384fd7eb8069fab02d82738bca33847:8945f040ec4b2e7313a5f2917bbaf9b4:ffa6a4fc620997e62d57abd9	2026-08-24 11:37:47.467	2026-08-24 11:37:47.467	\N	\N
bb9a5264-da76-4bfb-a8f4-631aa4e92068	Asha Solanki	+919876510139	ashasolanki154@example.com	FEMALE	c53ac0634d26679cdf16d7e0d4165a5023a704b446e2b0bccc714e4ffbb92ffa	XXXX XXXX 0139	e98ac89a006369fc8a2286ccb7a47934:b4d088f101f09f3f8a9864593225368e:e3a2b0829b992440e1da026e	2026-08-24 11:37:47.491	2026-08-24 11:37:47.491	\N	\N
f90b34f2-19b7-47ad-aad1-3f95280935ce	Bhumika Vyas	+919876510140	bhumikavyas155@example.com	FEMALE	e0d8418d1f454ca1d492c085d96df8610e6d4b68510fa5bca32527f33889638b	XXXX XXXX 0140	f799be21077466e95f7b06683b020421:a715d941b9beb29d9ad8e3f90534fd65:91cbecb05db84aa830f8e5e5	2026-08-24 11:37:47.501	2026-08-24 11:37:47.501	\N	\N
66f0301b-f6d8-493b-89c5-389d092d460c	Charmi Patel	+919876510141	charmipatel156@example.com	FEMALE	e8a317e0ac851622787a9150a88abef1a41eacb2942c75b9655d66427524f1a9	XXXX XXXX 0141	077ecf84dfcde6e159ee89aad5f1a529:7438b5a4c5b7ccf9ae519aa056772783:2fe4e9fd2b72c985e8a3729f	2026-08-24 11:37:47.511	2026-08-24 11:37:47.511	\N	\N
8a8bf8b1-9bdb-4364-8862-eea1cadd4e1a	Dhara Shukla	+919876510142	dharashukla157@example.com	FEMALE	71a0d7ac630af3747b699d2d8d083670790fc8878156cb20282e40d21a904de9	XXXX XXXX 0142	63b5dd86d59eb1a2942f3b222aa4f378:f84edde138ee33437e796e5d7ef1d53e:1a039c7bd0567a64ce0ad6c7	2026-08-24 11:37:47.519	2026-08-24 11:37:47.519	\N	\N
9e436ba1-8ab4-4776-928b-6dc7f5602b9c	Ekta Dave	+919876510143	ektadave158@example.com	FEMALE	703585561a28031e8e1045bb184b53c56307d6fea5f3c457db8a00057179de7a	XXXX XXXX 0143	0fd21b104a69acb9478ac97887ad9ffc:ed6fb18c78d1a9d59f87b8043a9d17d1:0d4cbb4fd7a02625b7ed504b	2026-08-24 11:37:47.528	2026-08-24 11:37:47.528	\N	\N
58c1600f-90ea-4bbb-ac20-a54fba6b6e09	Falguni Mehta	+919876510144	falgunimehta159@example.com	FEMALE	4351ea5c0d4310d61a66fe96f7bb8e42b61482b1f752ec1ac8cf57a2688be5ba	XXXX XXXX 0144	33d9d59a6dd16a7c534f7d5e087070d0:8c234f544bf8e895f1df516f3baacf03:1ea500cc3abca8efa2372b0e	2026-08-24 11:37:47.535	2026-08-24 11:37:47.535	\N	\N
c6fd89e8-094c-41a2-8163-b3df78128e81	Geeta Shah	+919876510145	geetashah160@example.com	FEMALE	ea07bbd671d0b719fdc8871710586ac8f6752b16df56b0e2ed0d0867c3a2d2b5	XXXX XXXX 0145	39f3d04add742441e896b654867bb288:7acbbf309fb3ca669175e1c904576855:43a6613e1a2428cc68ef365a	2026-08-24 11:37:47.544	2026-08-24 11:37:47.544	\N	\N
0e233735-eadb-4989-8b6f-1818a359817d	Hina Joshi	+919876510146	hinajoshi161@example.com	FEMALE	9eff845e53946a36cc4dd1e707438d829f946c6906be5eab532efa36fa531259	XXXX XXXX 0146	a77a156adfd0e557dddd7ad57740d6dc:c10d32c00926bdce67e81921b8e518d0:89bc4b2f6c176517af649f08	2026-08-24 11:37:47.551	2026-08-24 11:37:47.551	\N	\N
5e21e48b-dc8b-4ce6-a8f6-ce08beee0c7f	Ila Trivedi	+919876510147	ilatrivedi162@example.com	FEMALE	81c714de3105e30801ad1e773f1857223bcf12692896b8da924d184f4a3ed4f7	XXXX XXXX 0147	753573a5b9d946818f4ccbbda914dd7e:32005cdacaf9d00c680772012b3c1f1d:88d84ca7cf9022437d24c7a9	2026-08-24 11:37:47.56	2026-08-24 11:37:47.56	\N	\N
f994c038-80b4-413d-b769-1b7a450e3970	Janki Desai	+919876510148	jankidesai163@example.com	FEMALE	134548ef28afc1e6219612a6f4df6117c5d61b14f784167bc8ad222c7efb474e	XXXX XXXX 0148	3c45d54f80f82810a0f3fadbf50a87f1:b1e0c6da70d9d04371b07bb1416f5837:082933c359c6e3a35c3e5138	2026-08-24 11:37:47.568	2026-08-24 11:37:47.568	\N	\N
2ee3a62f-e5a3-416e-ae59-1502a697efdc	Kajal Bhatt	+919876510149	kajalbhatt164@example.com	FEMALE	a65e6d5768d7d6212d01ab558efc08c5f79f425f397d94bcbf8d7864a6f1b920	XXXX XXXX 0149	4d602b52e62668832630dbbe08c80985:2886310cf5e456a86e69f8f3386321a1:7575c9511d77715960140ada	2026-08-24 11:37:47.576	2026-08-24 11:37:47.576	\N	\N
af267efb-bd47-410e-bcdc-1a13c0316380	Lata Vora	+919876510150	latavora165@example.com	FEMALE	12d66cbe647b28ff1a162797987ae227a9a5bd3d4c4cc8917b9fa19ef120efb1	XXXX XXXX 0150	94a0de6e58dcacbc51e4b72287840d02:5521f1d1af2344f569f49282bc225239:b21fb43fa13ea78ecd83f6f9	2026-08-24 11:37:47.583	2026-08-24 11:37:47.583	\N	\N
c9f4a0cf-5739-4562-b7a2-b16315bc1789	Mamta Parikh	+919876510151	mamtaparikh166@example.com	FEMALE	a0436c68862de236064b52a7892ec06b29364d9084499741e50e90f93189b24d	XXXX XXXX 0151	48d2022c9880eb1fe63a4360a98ff1e7:d877a9fabd3a703eb9d1be095890d383:3643ba6e0c29670402c69e23	2026-08-24 11:37:47.592	2026-08-24 11:37:47.592	\N	\N
db30cd37-52bb-4687-90af-9a95cf39d937	Neeta Rathod	+919876510152	neetarathod167@example.com	FEMALE	4b387bde000d2602b3dc760995e4e846c7a724650437dda2d006007c5622d4dc	XXXX XXXX 0152	0565501bde51e9b9f0b460ee07ef6da6:e6c3285431c12a3583682e70349dbd23:d597cf6b49d6120ef68483f7	2026-08-24 11:37:47.6	2026-08-24 11:37:47.6	\N	\N
d9ef809e-0c20-43c5-aaf3-1e333a52683d	Priti Panchal	+919876510153	pritipanchal168@example.com	FEMALE	545840a532cb3bf961d8c7d2cb814234fa9d7c9dd2371ade23f761d25d116f2f	XXXX XXXX 0153	cce4e663d285a548ad05f706994bb6ff:32cc6e9c514c9907c4a7050e9c8f52cd:97e2f019d31b7effd16296ee	2026-08-24 11:37:47.613	2026-08-24 11:37:47.613	\N	\N
997c2907-9726-4d22-8566-66c505df8d6b	Rekha Chauhan	+919876510154	rekhachauhan169@example.com	FEMALE	703f35cf30e5bd0cf60c008994adb9229cc7b5eb0b9fa0907985d09e7d09f548	XXXX XXXX 0154	b858dbdac9ade7153c6bf858770756c8:17694513a943a4597a84ef6560bb7833:b20edbe507adb4a267b5edbf	2026-08-24 11:37:47.621	2026-08-24 11:37:47.621	\N	\N
8a6fbb66-1a07-4cba-b828-465d625a2c36	Seema Gandhi	+919876510155	seemagandhi170@example.com	FEMALE	90b8c71cce44a8202072337733a453c53509b959b71f44e85723e74c17e33f82	XXXX XXXX 0155	17113aa7c425a2de2efd101e25bc72b3:355bcd73023c1bb9bdc48cc3694c4d55:a65471f3f8d4a3c7fa63cb72	2026-08-24 11:37:47.63	2026-08-24 11:37:47.63	\N	\N
de58e366-0a30-4f4f-a35d-dae49b4f600d	Tejal Rawal	+919876510156	tejalrawal171@example.com	FEMALE	c0fbc911a7bdedf7b444791714b7f5a289c08a0ad94c5e23fa336632fc33cf3b	XXXX XXXX 0156	88f2782e4164658d4ba2d7fc986ba425:9522c204c1cfbc807073ee2ca4c1a930:37eea630173c81c58a3f208f	2026-08-24 11:37:47.638	2026-08-24 11:37:47.638	\N	\N
36fbd438-ed66-4a71-b401-ea630a09ba71	Urvashi Patel	+919876510157	urvashipatel172@example.com	FEMALE	ba44cefab7f528516f0db1bebd7e564cedf41964432bfa672deaf23400200e25	XXXX XXXX 0157	90086eaac460db0b8bb830a5a634b0f3:b1e93bc806449500d9f0eb65d92a132e:a1d2a28c45a6d28b26393676	2026-08-24 11:37:47.646	2026-08-24 11:37:47.646	\N	\N
cbbe770a-9a7b-4846-aae7-d01a800db9b1	Varsha Soni	+919876510158	varshasoni173@example.com	FEMALE	7cee46a6e2c0f81c86a8027232b0c22c7db2eb840379acb1f603936de4ab5764	XXXX XXXX 0158	848c14bcc54dd6c0202493ed693e8623:e300bf74fa73fc1b0eb630411ddf1880:f5ab391b20c798dd32070611	2026-08-24 11:37:47.653	2026-08-24 11:37:47.653	\N	\N
43407c0f-7501-4119-ae47-542249d573c9	Yogita Raval	+919876510159	yogitaraval174@example.com	FEMALE	5ba65d6075e87552b12e66f2f53d1ace98cc4d2e5802356c2072054cf7e7aa9b	XXXX XXXX 0159	a8849a3e6bccbcb794dcb23c59f9591b:71c17b5c76311eca5e2b888ed495b20c:e802235c8ce21be43c2d1e0b	2026-08-24 11:37:47.661	2026-08-24 11:37:47.661	\N	\N
bd835c77-4c61-43ae-baba-7e142bb64ca1	Zarna Goswami	+919876510160	zarnagoswami175@example.com	FEMALE	1c54000d2119a9580a010bd654b9932375fd97b8ac995090a179e2c903b6bb4e	XXXX XXXX 0160	7219ff4947df089cd558d601f4d9a9bc:660292ac82604a66ded9ac00a3f6159c:b26e41b3e1edf7c34f69200e	2026-08-24 11:37:47.668	2026-08-24 11:37:47.668	\N	\N
659fff5b-eea9-4456-a742-d308d7582997	Amrita Purohit	+919876510161	amritapurohit176@example.com	FEMALE	ccba798fe45070280c870bb1f3fbaef6888fcd61ad9d49cd609c85263190565b	XXXX XXXX 0161	449c11a56876789101f67f42f7c6b5f3:f7b5e3d24302ad687d45e4081c843cd6:a7f22891b0e3cc9436f707b9	2026-08-24 11:37:47.677	2026-08-24 11:37:47.677	\N	\N
534dee14-0e40-42c6-a6af-5facad252786	Binal Thakkar	+919876510162	binalthakkar177@example.com	FEMALE	63138340b1bbad3e10a9a394c9cd5962d48168ba93bea4c5fd313dc6a527095e	XXXX XXXX 0162	e8437a5c168c74d71e38cab7ffae05f1:3895ba97aa9eb2ee6ccba35e9078feab:68d65d3f388719f0cb61dea0	2026-08-24 11:37:47.685	2026-08-24 11:37:47.685	\N	\N
587bcf6c-4ca6-43f7-a153-1e6529d0ca82	Chhaya Modi	+919876510163	chhayamodi178@example.com	FEMALE	bde48df20717d25ddc04ac78acaf1abbe3e66f38c26757b335b93a28cd6414fb	XXXX XXXX 0163	f8fb09f6ea18aeda87f12896b893e86b:5f4e0f9681f694640ab0d250caa33e06:763726b52b799f918cc55cd7	2026-08-24 11:37:47.696	2026-08-24 11:37:47.696	\N	\N
3abb916e-76ab-46dd-997c-35af38863bad	Ananya Sharma	+919876510164	ananyasharma179@example.com	FEMALE	c88ca4252c9bcdb92ba893b200a6e54b4e91938adcb1b4eb7c0d5233b08583a1	XXXX XXXX 0164	8276d88c6efa869511d241d45a48f1e5:48ed6ba16a5cd115fe20664d18091d39:921d24a0c1227b7416608ad2	2026-08-24 11:37:47.705	2026-08-24 11:37:47.705	\N	\N
f32789c5-207c-4b6d-a934-a5e8a36fe02f	Riya Patel	+919876510165	riyapatel180@example.com	FEMALE	12b8ac72511218333ad96d9f3e49281bbc7ddde26793eb0e6b37f25708b94d1e	XXXX XXXX 0165	6f95e56d77256b2ece1db0f5702cd930:059f93ff85db9b27483a970cae5b79ae:73b76fb1bf60a39bb441774c	2026-08-24 11:37:47.712	2026-08-24 11:37:47.712	\N	\N
dc303dd0-7af4-4006-adfb-3c8fc5225686	Pooja Joshi	+919876510166	poojajoshi181@example.com	FEMALE	23b8fb41f8fefc94284f109ccc957270ddc7bc8bc15f602bac3cdf6a11acdbb9	XXXX XXXX 0166	6d2b1268056d06f38c142ee93070b488:777534e60cefcde22a7e27bce4b5bdc8:91c99886883e0b8086006138	2026-08-24 11:37:47.72	2026-08-24 11:37:47.72	\N	\N
ac0a5044-a1df-4f0a-8a4d-ffdf06dc6f81	Diya Trivedi	+919876510167	diyatrivedi182@example.com	FEMALE	5eb224d632b37ce9db93c3d90ea49f9d884bd0985590cdba26970631aa167e77	XXXX XXXX 0167	45f03bee0bf59ee246f90d06d92e9c2c:131b69e8d09523637cfb8822913fe05e:960bfd680f7ebebe31d124f3	2026-08-24 11:37:47.728	2026-08-24 11:37:47.728	\N	\N
bcf8c33b-19a9-4b5d-bb2f-bb08dcde5258	Kavya Desai	+919876510168	kavyadesai183@example.com	FEMALE	20704d8687c3741099e069ceb05c99d0afa3527a8236c5c3bf7fc563012b6f9e	XXXX XXXX 0168	b6a1fb0d5e887e5c4ee2f827c5a6bc8a:9a043cc669c502db670dcf224813d881:b2e756a03eaf953910718795	2026-08-24 11:37:47.736	2026-08-24 11:37:47.736	\N	\N
a954ceb8-6cd9-48b9-8573-1ee095669cfb	Ishita Shah	+919876510169	ishitashah184@example.com	FEMALE	af0db604483afd9a4f6fe4541803d4626f86d631424715d4093c61b7bdc47c7b	XXXX XXXX 0169	9c7b984f3f33b49053f6a070918b6910:fee62a100c51038dae06c77734b460b5:6aaffeb7479e849de86fcb30	2026-08-24 11:37:47.745	2026-08-24 11:37:47.745	\N	\N
a0d51f7f-b57c-45e1-9556-77f980173dd4	Tanvi Mehta	+919876510170	tanvimehta185@example.com	FEMALE	066044fe9821f06df4e604da2382a1dd55f653cbf2af40554480e97d81f9d71e	XXXX XXXX 0170	d2fd0695d88724ec53287a42296c32d7:261f5a0873ba7af21525f4e95194966d:8164931d62b610fcbdeb410d	2026-08-24 11:37:47.754	2026-08-24 11:37:47.754	\N	\N
f9c21b0d-3b37-41ea-9eed-abaa56641bc7	Niyati Bhatt	+919876510171	niyatibhatt186@example.com	FEMALE	ec80ac2b5aa8cde04ddce3bf3d565a1585ecaab9781701acaeeae39031d6ef1d	XXXX XXXX 0171	3c4f1c62e47027fb98a53ff15a7140a4:988b650ff9b0cbcade4e6ae24a0ee08d:d86dd5bdd1e3a4634608e5dc	2026-08-24 11:37:47.763	2026-08-24 11:37:47.763	\N	\N
2332f686-814d-494d-846c-80b60febe3cb	Avani Dave	+919876510172	avanidave187@example.com	FEMALE	532ab94b060260eb0b88c1790cbe665846fca62846ac8c4b960ad3985136c889	XXXX XXXX 0172	d2d0f4af30cecc570f5c5596eea4cc77:c18af4a90db871e845f2a39360634777:62f38931f459a292170bd37d	2026-08-24 11:37:47.774	2026-08-24 11:37:47.774	\N	\N
d4e5d3d9-2c89-4f23-8b45-76461c1c5abf	Sneha Vora	+919876510173	snehavora188@example.com	FEMALE	13881e33099e623ed290e39e1e6559092076f45488f0f192268274031a868bba	XXXX XXXX 0173	76d804f795e291db94e5e5c427e306cd:99211310e606097939e9db7db9125b59:2d27d88a19a0b74000aab885	2026-08-24 11:37:47.783	2026-08-24 11:37:47.783	\N	\N
47880a79-041d-464f-a931-51629cca3436	Khushi Parikh	+919876510174	khushiparikh189@example.com	FEMALE	00901f8fbb2485973804cd76fcf57d3be75083f5245442f515f7a44f58905325	XXXX XXXX 0174	6f933de65539ca0917f5c32c6ef4fd96:78485492a12fde9ac503b4b790b66f33:43dc276aa16c6260ed46cdb6	2026-08-24 11:37:47.792	2026-08-24 11:37:47.792	\N	\N
402e1e33-6231-41d3-92a6-24496141fa00	Radhika Vyas	+919876510175	radhikavyas190@example.com	FEMALE	a26eb6ffadfb09e9345098e6d2a5de38fbca09f605019fe2973df60ff1e01d74	XXXX XXXX 0175	28cec13865b407da66032f5929ea7dbd:cd0550629a2d5062a22fda86c3938940:fed25a9d854df5742b1daac5	2026-08-24 11:37:47.8	2026-08-24 11:37:47.8	\N	\N
6d78dbbf-e7af-44c1-9072-15de3b1588e7	Bhavna Rathod	+919876510176	bhavnarathod191@example.com	FEMALE	8a0bebd4ae20100a18a5e234fb4d7eb4cb255bbc9f1c102058d1870a208d5d02	XXXX XXXX 0176	dcbe6cc3644cbc5ecfbb390380e881b4:421f1689033b3714ec59ff594b9c81a3:25c4ad2938bb05ec2a56b432	2026-08-24 11:37:47.809	2026-08-24 11:37:47.809	\N	\N
2636f682-fafb-413f-ad2a-3cf85d8a8d13	Priyanka Shukla	+919876510177	priyankashukla192@example.com	FEMALE	3744bbe3438f638ff9eb4949b15213b5815185d89768d4dfa5551be39e380ef1	XXXX XXXX 0177	8d494ea2bfe5ea6fccad55b27dbba0fd:cee82a8658643ae50dcd0f98dc4b175b:2aec2e6dc0f2456e634c3945	2026-08-24 11:37:47.817	2026-08-24 11:37:47.817	\N	\N
6aa15961-4706-45fb-9610-77eebdc5c577	Drashti Zala	+919876510178	drashtizala193@example.com	FEMALE	6969021d304895c294183bc91d1971319b3f86225d9fb90fe5fdd9c87ab00944	XXXX XXXX 0178	d80e921029cb27c0a473b40f2580941d:df5f62487a1638883ffc0b7dad22a0df:69a0691dada963cc34b2deb0	2026-08-24 11:37:47.826	2026-08-24 11:37:47.826	\N	\N
6a1d38b5-06dc-4112-86bd-97561d6c474e	Meera Panchal	+919876510179	meerapanchal194@example.com	FEMALE	d406b4b23f50b8da73023cf52b1a7237b5a18660e61c05d7e51a438c65be4821	XXXX XXXX 0179	a66a18fa4e1fef1b894c70806f5ebb5a:0a53a290f8b0d640d5955dea47b7ba5e:1b657b9a63b1584c05c9baa8	2026-08-24 11:37:47.835	2026-08-24 11:37:47.835	\N	\N
e53d9ebc-d012-42ee-b9ff-1c2e37918936	Krutika Chauhan	+919876510180	krutikachauhan195@example.com	FEMALE	b90ce6ac2ef483ac09c48871a11e383be0e96386a8f740b926e4169485b012bc	XXXX XXXX 0180	bbc009508936a3c6b655190684d5a671:b75d7069bc581844e22ab5641f6be76b:62d4460fa8a29a6459c9e7c6	2026-08-24 11:37:47.846	2026-08-24 11:37:47.846	\N	\N
454ae142-f647-4335-956c-03b247aed2ba	Kinjal Gandhi	+919876510181	kinjalgandhi196@example.com	FEMALE	1eae958853a414f493a6bff6b16073b7892c1de7b64623f4a248d4b13b32fda0	XXXX XXXX 0181	4c2fc406a073f96afb741b181953f855:16c184e4fba10cdb008f087b50446c03:ec907deacadd9e584445a23d	2026-08-24 11:37:47.854	2026-08-24 11:37:47.854	\N	\N
8579cf1c-a557-4471-b315-d8c6fc7d9f4e	Jhanvi Rawal	+919876510182	jhanvirawal197@example.com	FEMALE	4bd30ac193440e9d1235f84db461aa6b07459707da7d5931e098731034eb5c77	XXXX XXXX 0182	49c3008d7474887ce86a2547e27a31fd:b3f109ec6eed43d69ed84654c1d3bc8d:e192523f7442ca0772b08000	2026-08-24 11:37:47.861	2026-08-24 11:37:47.861	\N	\N
bd665a05-6a92-4efd-85dc-f68706d31455	Kiran Patel	+919876510183	kiranpatel198@example.com	FEMALE	6d7b1902e8b0bf9e23c50ae942454d60767c61bee0471d675c08e8953ecfd5ac	XXXX XXXX 0183	1a66c7750799d96e77f62d5c3a8e56bb:aa427fbe1cd98c749202338211315841:7500d690611e1de2817b07ac	2026-08-24 11:37:47.872	2026-08-24 11:37:47.872	\N	\N
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "actorId", action, "targetEntity", "targetId", payload, "createdAt") FROM stdin;
3d3cd95b-3b02-43f7-8e26-fa251af9f3d5	761a2b29-f2ed-4b53-af34-b0754012fad8	ONLINE_PAYMENT_CONFIRMED_PASS_ISSUED	Registration	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	{"amount": 1200, "method": "ONLINE_GATEWAY", "receiptNumber": "RCP-2026-1041", "credentialsCount": 2, "providerReference": "pay_TTazjRXocgTt77"}	2026-08-24 11:47:52.502
5d870665-c1f9-47a7-a339-35b7650034cc	761a2b29-f2ed-4b53-af34-b0754012fad8	APPLICATION_SUBMITTED	Registration	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	{"passType": "KIDS", "amountDue": 1200, "attendeesCount": 2, "registrationNumber": "SS-2026-000184"}	2026-08-24 11:40:30.779
70d28022-1652-40a7-8bca-bd02da36a11e	761a2b29-f2ed-4b53-af34-b0754012fad8	USER_LOGIN	User	761a2b29-f2ed-4b53-af34-b0754012fad8	\N	2026-08-24 11:40:51.337
f911637f-5c05-4643-86a9-e960742a4882	761a2b29-f2ed-4b53-af34-b0754012fad8	APPLICATION_APPROVED	Registration	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	{"decisions": [{"status": "APPROVED", "attendeeId": "76843426-6af2-4b19-8f0d-5367d65e34eb", "reviewNotes": ""}, {"status": "APPROVED", "attendeeId": "964b84a6-ad92-4b5b-bbfd-e22961b63ef0", "reviewNotes": ""}], "globalNotes": "", "approvedCount": 2, "paymentLinkId": "paylink_b23cc9330fad87059916b1b871fba81e", "rejectedCount": 0, "recalculatedAmount": 1200, "registrationNumber": "SS-2026-000184"}	2026-08-24 11:47:15.527
\.


--
-- Data for Name: Credential; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Credential" (id, "credentialNumber", "passCode", "registrationId", "attendeeId", "secureToken", status, "issuedAt", "usedAt", "createdAt", "updatedAt") FROM stdin;
b448e25a-aece-41ef-9fa6-02b74bcfd066	PASS-2026-481673	SS26-KIDS-F07B	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	76843426-6af2-4b19-8f0d-5367d65e34eb	ss_qr_4de4707b320c2ceee601f683b859e6c7fd320ea0989a2bd1a7168a9a7bfbe5bd	ACTIVE	2026-08-24 11:47:52.493	\N	2026-08-24 11:47:52.493	2026-08-24 11:47:52.493
a546aeba-b742-4367-8582-8efa27da696b	PASS-2026-275291	SS26-KIDS-64F6	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	964b84a6-ad92-4b5b-bbfd-e22961b63ef0	ss_qr_a6a3f06f34e8f8c994ca7d7dc99e7e04e06e9ea94a71a60f96c393306f610fc2	ACTIVE	2026-08-24 11:47:52.498	\N	2026-08-24 11:47:52.498	2026-08-24 11:47:52.498
46fcb56f-bc1c-400e-9adf-1a2c5b748547	PASS-2026-3101	SS26-SINGLE-BFB6	3e797c61-2629-4a47-9356-642d7499f406	b89062d8-95b2-4dc8-ac56-6916a0af4c1e	ss_qr_b0c4fd9388094cbb2b76a22915bae169163b8863ce89718d09d7fb47dcd49f2d	ACTIVE	2026-08-24 11:37:46.703	\N	2026-08-24 11:37:46.703	2026-08-24 11:37:46.703
e8f5e17e-4577-40da-a2c1-bb7535a98bb7	PASS-2026-3102	SS26-SINGLE-20B3	16efb7a8-64da-46f9-8a5b-e45c29a1912d	5a64017a-6a57-4f7e-a882-2fdc4c315983	ss_qr_8cde600490973c280c0376bf0f8f0fb39e7a3e024c62465d70ac8cef3202257a	ACTIVE	2026-08-24 11:37:46.718	\N	2026-08-24 11:37:46.718	2026-08-24 11:37:46.718
4f53fff4-47b0-4d50-a005-94a6d8d6a44d	PASS-2026-3103	SS26-SINGLE-A46B	bbd8110c-9eb5-44c1-acf2-92b91c977ec0	9b929bd7-324d-4eea-b179-396104fab46d	ss_qr_41991e8cc91e466309e149a90832128c00e4d9ad76c78725cf7564298d5c2a21	ACTIVE	2026-08-24 11:37:46.746	\N	2026-08-24 11:37:46.746	2026-08-24 11:37:46.746
8c9750cd-adc1-464e-81b4-3938a839fe44	PASS-2026-3104	SS26-SINGLE-4987	9c0bfc70-2bfc-436d-8749-db7ed8b262bb	6c4040dc-a35c-48b6-b023-91e714ea266f	ss_qr_2511d5e2f74b6bf88965314194c545ad9bacfd522a8ab8d8887c6416a5e7a7f1	ACTIVE	2026-08-24 11:37:46.765	\N	2026-08-24 11:37:46.765	2026-08-24 11:37:46.765
67daa2e5-4ff5-45ec-8d29-c9ac2f6068b0	PASS-2026-3105	SS26-SINGLE-BD7E	83199275-c93f-4e7c-9728-c7721f0aa76d	1b81be44-7216-464f-8ba6-f81359acd345	ss_qr_17a807204888058543a0a6bbaa66ab2af53de0eeff99558c73044c89cb17629c	ACTIVE	2026-08-24 11:37:46.783	\N	2026-08-24 11:37:46.783	2026-08-24 11:37:46.783
d7980362-3b48-4869-9a31-0bc54d4bf235	PASS-2026-3106	SS26-SINGLE-A5CD	6f12622e-2914-45c6-90e7-32070f3814f9	6b5e9370-6196-4c44-8ddb-d6d80ba4ad29	ss_qr_4043987e1d52a489e22f18e7bebeda30141f3a7044a78dae03ea260b7505b276	ACTIVE	2026-08-24 11:37:46.804	\N	2026-08-24 11:37:46.804	2026-08-24 11:37:46.804
e38ddfe2-8f22-45b4-9985-0fe4a616af04	PASS-2026-3107	SS26-SINGLE-5AAD	fd932af8-f4c6-43d8-8678-53467a39d39a	aa9e6fff-daba-4bfc-8ed9-98b32ff086a9	ss_qr_19157757643404eede67290b3a1baadc09c572f3254a271266536ac3580c01ee	ACTIVE	2026-08-24 11:37:46.819	\N	2026-08-24 11:37:46.819	2026-08-24 11:37:46.819
c26d6dbf-4694-42f2-95eb-94293f2db848	PASS-2026-3108	SS26-SINGLE-8810	608d6706-1c07-46a5-bd7a-d1aff4579229	373c58f8-e659-435a-b40e-1d055b0533ca	ss_qr_226e5f1fa2e1e57ed5360942b2daf67455183e81fbc3c12d618bb0938c880bca	ACTIVE	2026-08-24 11:37:46.832	\N	2026-08-24 11:37:46.832	2026-08-24 11:37:46.832
a0fc272b-c410-4ddd-9094-a33a6a35f636	PASS-2026-3109	SS26-SINGLE-2132	98169fa1-f3bf-4020-b257-6da0a8e1ae90	10ea55b6-0309-4988-8d2c-2229e3176707	ss_qr_bc089ff068a612dca00ab14af7c221d43bff20c656f39bf25975f497b284e389	ACTIVE	2026-08-24 11:37:46.85	\N	2026-08-24 11:37:46.85	2026-08-24 11:37:46.85
e17c40b2-4708-42d7-bb6f-5be271413a68	PASS-2026-3110	SS26-SINGLE-A7A4	782ea22e-fb6d-48aa-84f6-2beaceccb77a	69316941-f21f-4385-95a6-0348b7befb3b	ss_qr_b4dd0ee3242b82d34cd90bdd37e0cc5e461b4d84a87da4dd9a25202b13393103	ACTIVE	2026-08-24 11:37:46.864	\N	2026-08-24 11:37:46.864	2026-08-24 11:37:46.864
1edca85a-3dc4-49b8-aa30-0a20f9852241	PASS-2026-3111	SS26-SINGLE-BCBD	13e744e3-2e9c-4fb6-b6ad-eb4b8aed4889	4a3f4b26-47cf-4a5e-afb1-2dcbf19d06b9	ss_qr_ce690ec1ee6d0f6d7e1cc184118f928d6084c35567d45511a89361ca8a708932	ACTIVE	2026-08-24 11:37:46.881	\N	2026-08-24 11:37:46.881	2026-08-24 11:37:46.881
8b9c4b25-664a-4a18-9154-eec644129c07	PASS-2026-3112	SS26-SINGLE-E884	f12a1fca-c2e1-47b3-847a-4bb43d7906ba	c1608127-72a9-47b3-bc61-52d83b14c7a3	ss_qr_be0376eef8cd181744d45bbd8ef58f7ed7918a51f48484923fbf4e5529fabbf5	ACTIVE	2026-08-24 11:37:46.898	\N	2026-08-24 11:37:46.898	2026-08-24 11:37:46.898
6d1a0d63-4ad9-4f06-bf6f-a4559f415f63	PASS-2026-3113	SS26-SINGLE-0DF4	750ed2b5-c276-4b33-9379-1896e6a9d899	f242dc20-c343-443e-a234-ecdaaff1ddc1	ss_qr_838f71752ca3cfc6736b47bbaf8861906c65efda168befb8fbf5401142dbfe2f	ACTIVE	2026-08-24 11:37:46.914	\N	2026-08-24 11:37:46.914	2026-08-24 11:37:46.914
33b40858-1f65-40bc-bf8c-3b48ea291349	PASS-2026-3114	SS26-SINGLE-63F3	7ede1f9a-def6-4b65-97e8-714072d88597	b15e392a-86a4-4808-843c-e501dd83ed02	ss_qr_09c510d4b453abab716adb42a31c313c7545b5aac6e1e8db320b6b57233ade3e	ACTIVE	2026-08-24 11:37:46.931	\N	2026-08-24 11:37:46.931	2026-08-24 11:37:46.931
4b83ca12-733b-4af8-9a9d-d7d199e31cc7	PASS-2026-3115	SS26-SINGLE-97A7	7ae9d48f-4111-40a6-9933-5e142c736501	7affed51-2c81-48b1-b122-5be6a8081ce1	ss_qr_f4f8ab8073f22ea6a4d5f76b3331d46dba6f77581f4795f0c893023fdc0fe31e	ACTIVE	2026-08-24 11:37:46.945	\N	2026-08-24 11:37:46.945	2026-08-24 11:37:46.945
4a5dd9d3-d401-455d-ad3a-14ec8703a6a0	PASS-2026-3116	SS26-SINGLE-36CA	e414bc08-79ae-4550-a83e-d378e567abe7	488cf082-8c88-47a9-86f9-efdb0e777962	ss_qr_6382d6ffe5b4547cb525adb294d53e5f68be09389c314ebe7992716cafc7939c	USED	2026-08-24 11:37:46.961	2026-08-24 11:37:46.96	2026-08-24 11:37:46.961	2026-08-24 11:37:46.961
3b9106e2-e42b-47c5-956c-5eab4f8eaba0	PASS-2026-3117	SS26-SINGLE-0718	da146339-f00e-4060-993e-0e4c9b5f0b98	145b95ec-8cb4-4136-ba94-d5c1487098f7	ss_qr_490cab3c3f6cbda034e1cda9ecfab63b4a7e061796da093ff6ee3b48a9c7dce9	USED	2026-08-24 11:37:46.986	2026-08-24 11:37:46.985	2026-08-24 11:37:46.986	2026-08-24 11:37:46.986
e50223cc-d103-41ad-94a6-d9e4b59c1321	PASS-2026-3118	SS26-SINGLE-FA37	3b802327-684f-44e9-894c-266fe9bc3fa7	6edbf979-570c-48b8-84a7-25b55b92d096	ss_qr_fb919380203062b92ef4becf8e4376a5a6762c6e447e01cff2a213d1a84b68cd	USED	2026-08-24 11:37:47.01	2026-08-24 11:37:47.009	2026-08-24 11:37:47.01	2026-08-24 11:37:47.01
75cbb946-5ea0-4b77-817b-5d3b7b762f18	PASS-2026-3119	SS26-SINGLE-7FC0	d84935eb-4591-4228-bdfe-754b4f836512	62aeff75-3276-46e7-b801-0a7b6088d853	ss_qr_8f914b3ac1db07042e60640d897d866d6c456d215b37a28913f9d0dfbaad3926	USED	2026-08-24 11:37:47.028	2026-08-24 11:37:47.028	2026-08-24 11:37:47.028	2026-08-24 11:37:47.028
74ca4792-e0fa-4b4c-a279-f7024766e5ee	PASS-2026-3120	SS26-SINGLE-7722	65981830-f445-4695-9eb8-7f9914e3849a	0eecd093-e618-47c1-b1f5-11589ee16f53	ss_qr_3758b610b004af79ab81dceaf880deadd556012fd504f2e44f8780dd4ced5152	USED	2026-08-24 11:37:47.048	2026-08-24 11:37:47.047	2026-08-24 11:37:47.048	2026-08-24 11:37:47.048
180d257b-c8ee-405a-a331-511ce183f184	PASS-2026-3121	SS26-SINGLE-BAC5	fa3ef199-eefc-4ee3-bd1b-8301834e7c74	6546d88b-437d-45fd-a292-d428351d29de	ss_qr_33e1b5b2402f1a1184f54b7dc84471bca3b1d8d3c4a8f43290606897e470c956	USED	2026-08-24 11:37:47.067	2026-08-24 11:37:47.067	2026-08-24 11:37:47.067	2026-08-24 11:37:47.067
9198adfa-a802-4e91-9c3a-16dea2f2afef	PASS-2026-3122	SS26-SINGLE-918D	19e9c4c3-e633-4755-bd27-cf3f21ad39d3	263f5594-8f8a-41e3-a641-20b57a0f0c9d	ss_qr_e0286ee452f4e0f039ba12fd1509064da6050416a3f18355b4032289ae82cee4	USED	2026-08-24 11:37:47.087	2026-08-24 11:37:47.086	2026-08-24 11:37:47.087	2026-08-24 11:37:47.087
dedf57ca-86e6-40de-be96-498f6a25e35a	PASS-2026-3123	SS26-SINGLE-2FB9	08fa8e22-6ea7-409c-83d2-b4617fc7e9c3	80ce788d-afb5-4f40-b72f-dd5cde663f1b	ss_qr_96cf2ae3dab6955455bf8a865fda62812cd77486507cc10cf026fe2439b319fb	USED	2026-08-24 11:37:47.11	2026-08-24 11:37:47.109	2026-08-24 11:37:47.11	2026-08-24 11:37:47.11
13507ea6-3d41-4909-9fbd-739c3dc3228a	PASS-2026-3124	SS26-SINGLE-BA88	7c933f2c-3a2e-4989-8140-354d368d7b19	d827e489-a44a-4efe-aea4-8974c180c18d	ss_qr_ec1c0ec4935f1aa13debad475eff98722c8638e26c1b2ded685c9879e03d1702	USED	2026-08-24 11:37:47.13	2026-08-24 11:37:47.129	2026-08-24 11:37:47.13	2026-08-24 11:37:47.13
4ca6d08f-a179-4ea4-b0ab-cb8c404cf920	PASS-2026-3125	SS26-SINGLE-F2AE	741a9853-db5a-457c-94d9-14fb759aeb3a	0a3f73ec-d434-4e82-bc23-1589b7cada50	ss_qr_59f704605378346b4f9978c25de414ad47a06ebe28079551b43022cf22668a02	USED	2026-08-24 11:37:47.148	2026-08-24 11:37:47.148	2026-08-24 11:37:47.148	2026-08-24 11:37:47.148
085b2ad4-4f26-4da1-844d-0697d0ec45bd	PASS-2026-3501F7	SS26-COUPLE-0A26	81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	d866f99d-317d-440d-8160-78614bae9b70	ss_qr_98c1a8ecdf1051cb5d9e460267afafc8b84d0518e2557d551f4b3b094cb74627	ACTIVE	2026-08-24 11:37:47.173	\N	2026-08-24 11:37:47.173	2026-08-24 11:37:47.173
fd361676-baee-45cb-890f-19312705a421	PASS-2026-130470	SS26-COUPLE-0260	81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	8822bea3-95db-4ddd-9a04-34273b7ad6e3	ss_qr_9ad42c5c6dd4f1b14074b6bba87c12f57e749e228cbf10e8ac7d6f1234df8ab4	ACTIVE	2026-08-24 11:37:47.176	\N	2026-08-24 11:37:47.176	2026-08-24 11:37:47.176
a01ea4cd-670b-44c5-a0b0-117cad35202d	PASS-2026-46B2C0	SS26-COUPLE-8457	fdbe78c5-c4eb-440d-8614-df0754f98b66	59a1cf1f-9a0b-425e-8917-8cd5e20951b8	ss_qr_71a3a4b8024ee6afa8059dc024335588c134e97f82e4248cc72140890c44770f	ACTIVE	2026-08-24 11:37:47.196	\N	2026-08-24 11:37:47.196	2026-08-24 11:37:47.196
9447a9e5-2202-4f4e-93bf-7ba3cae8c7bb	PASS-2026-D92101	SS26-COUPLE-B8F6	fdbe78c5-c4eb-440d-8614-df0754f98b66	acb3fc34-51aa-428b-9b32-1e5c51fa79a1	ss_qr_1b6a711873f534f14e2e1b86dadecf914f82f37556fcc64a752a8a9e50a9232d	ACTIVE	2026-08-24 11:37:47.199	\N	2026-08-24 11:37:47.199	2026-08-24 11:37:47.199
ba33b254-ee4d-4dfd-9421-bbab2e66a470	PASS-2026-C20295	SS26-COUPLE-E28A	4287d3cc-2fe6-4d89-b210-611dfed151e8	0a5e5647-1b01-484b-8255-8aa5c44b8352	ss_qr_d95c4af91d636a1a66672441af6235015d7aa9a2cc89e704cdb3d1bc39b7bf11	ACTIVE	2026-08-24 11:37:47.223	\N	2026-08-24 11:37:47.223	2026-08-24 11:37:47.223
8a4d0ebc-39bf-4848-838d-9af60f5fbf37	PASS-2026-42055E	SS26-COUPLE-D2AC	4287d3cc-2fe6-4d89-b210-611dfed151e8	af7f879d-d231-4c32-9541-1c211c502f38	ss_qr_521b8593b3fc07e9f04619a9933a9d4c34da2f5edefc4449af53b193cd3c7572	ACTIVE	2026-08-24 11:37:47.225	\N	2026-08-24 11:37:47.225	2026-08-24 11:37:47.225
a0a9b4a4-0fae-4532-8d09-e0f33cde96df	PASS-2026-616964	SS26-COUPLE-FCEA	2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	96461f20-d533-400a-aa08-0a622e429d51	ss_qr_bb63423cc99de41ea4048a41321b941fbab943f8b207bf9f0088f3ce15fb29d1	ACTIVE	2026-08-24 11:37:47.242	\N	2026-08-24 11:37:47.242	2026-08-24 11:37:47.242
e0314dbe-9454-46b0-a8b2-1735e9f76621	PASS-2026-5C1513	SS26-COUPLE-3BFF	2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	d60e8660-8f36-4409-8a1f-278aa2e7e543	ss_qr_97248f53293a9f3ba26d9a8983c4bd2c4099482095bd27671dd427ca51a5e645	ACTIVE	2026-08-24 11:37:47.245	\N	2026-08-24 11:37:47.245	2026-08-24 11:37:47.245
761de010-7dba-492e-bc43-191750c8ef19	PASS-2026-763B26	SS26-COUPLE-95A2	db8d3992-1bb3-4f88-b164-de033ba3a7f9	e6cdca11-225a-4ebb-a155-3fd14d4f7c47	ss_qr_b9cc5de6569b0019323dc0328a060ede48b5c313924bb068a3863bf9f5976dce	ACTIVE	2026-08-24 11:37:47.265	\N	2026-08-24 11:37:47.265	2026-08-24 11:37:47.265
485452be-36b9-40be-9cca-80899f00fc27	PASS-2026-761188	SS26-COUPLE-44AD	db8d3992-1bb3-4f88-b164-de033ba3a7f9	f78e9a40-a66c-40dd-8cca-505317ed6404	ss_qr_c1d93e919fb8529f0d643de616d2387413860bc7f9f4d9b338b81a33e9c209f2	ACTIVE	2026-08-24 11:37:47.267	\N	2026-08-24 11:37:47.267	2026-08-24 11:37:47.267
dba6309b-a6ad-415c-9c99-e65aeb4c64b8	PASS-2026-772BDE	SS26-COUPLE-D7E8	3a6cb924-bff0-4774-8c25-9c0f6e82898c	66d3185f-c890-4600-8ea9-0e6ae7d67c37	ss_qr_d18b280b51376a95afebf66ae46b4bdbbc4900cd8cfc7436179df9a7a6afef47	ACTIVE	2026-08-24 11:37:47.291	\N	2026-08-24 11:37:47.291	2026-08-24 11:37:47.291
2a80fd89-612a-495c-b7f8-87ce42e7ff60	PASS-2026-913EBC	SS26-COUPLE-D467	3a6cb924-bff0-4774-8c25-9c0f6e82898c	72aa7d48-17b8-485e-a3e1-f280f0121226	ss_qr_ad5ca5f148cf8b2e92a120343114753986c87e0f88b34d908f0ffaf625cffb36	ACTIVE	2026-08-24 11:37:47.293	\N	2026-08-24 11:37:47.293	2026-08-24 11:37:47.293
4475bcdc-0d42-48e0-a308-5d88a1efcbbb	PASS-2026-734880	SS26-COUPLE-220A	46599cfa-2de4-429e-a5db-c3d1e806509c	c369821a-c8b8-42cd-b25c-57f3f4c6787b	ss_qr_d51fffeb2277041f9b2b4c6d451769a8a20353f3b2d0540f92a0b7c82f5a956c	ACTIVE	2026-08-24 11:37:47.313	\N	2026-08-24 11:37:47.313	2026-08-24 11:37:47.313
69e77e94-3233-420c-b739-35935e9d91fd	PASS-2026-82407F	SS26-COUPLE-544E	46599cfa-2de4-429e-a5db-c3d1e806509c	8a9f1fe1-c092-4415-a400-ee6825a65b62	ss_qr_04d9f87c883d49c84402c68e47aefc3387c6ea27a06e10602ea98dd40b196032	ACTIVE	2026-08-24 11:37:47.315	\N	2026-08-24 11:37:47.315	2026-08-24 11:37:47.315
d0df5da2-73e4-44b3-879b-5802e630bb72	PASS-2026-129837	SS26-COUPLE-1C20	f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	8a43ed2e-3a93-4ef1-bb51-2d3f8ddac193	ss_qr_a3fcc6e95ffff86f93d271408b0c4f1a3e71d30e21556e442d5cd8cb625612b7	ACTIVE	2026-08-24 11:37:47.343	\N	2026-08-24 11:37:47.343	2026-08-24 11:37:47.343
202db85b-484e-44f6-84de-0f2a27e67216	PASS-2026-130992	SS26-COUPLE-2404	f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	6c9c3ecb-c5f2-4be4-8b86-3231e4281d8e	ss_qr_8c7505ec0c2e453b77c9d14c32a163e882dddb041ee8ccdbdf19f41b087435f8	ACTIVE	2026-08-24 11:37:47.345	\N	2026-08-24 11:37:47.345	2026-08-24 11:37:47.345
d4be80f1-2516-48ad-80a9-56e91bf406ff	PASS-2026-70FC6F	SS26-COUPLE-FFDB	46e19ebf-e200-4887-80fc-dffeaa6117a2	0d823321-e69a-4f1e-896f-e4400b984546	ss_qr_ee2bf93a9641b981fa0875594eae83f717a7c3afa5293daa4051d36ffba9c940	USED	2026-08-24 11:37:47.364	2026-08-24 11:37:47.363	2026-08-24 11:37:47.364	2026-08-24 11:37:47.364
9c1fba7c-3b89-410c-aab6-488dbfaa9c77	PASS-2026-E7CBEC	SS26-COUPLE-3E6A	46e19ebf-e200-4887-80fc-dffeaa6117a2	39301089-3e6e-42e7-a25d-28d692f03051	ss_qr_0a6f5e388f343ad1822d189a13d213661f011549476a49f3f1781c6d6614a9c4	USED	2026-08-24 11:37:47.368	2026-08-24 11:37:47.367	2026-08-24 11:37:47.368	2026-08-24 11:37:47.368
cc80ec88-4bbe-4af3-8201-26dbfe4397c0	PASS-2026-48DE58	SS26-COUPLE-BB60	af5f38c0-5ce0-41a0-ab57-a692d3ef070a	a0b0dfb3-3bef-4dd7-9386-6942e884b223	ss_qr_a63b072eaec92479fb681663e3159d6701ac69cb78023693e096ff88f9a4de3e	USED	2026-08-24 11:37:47.386	2026-08-24 11:37:47.386	2026-08-24 11:37:47.386	2026-08-24 11:37:47.386
6895c5f1-da4c-4a8f-bcfb-b86689f55e51	PASS-2026-E30F40	SS26-COUPLE-F1AA	af5f38c0-5ce0-41a0-ab57-a692d3ef070a	88511bf3-a7d7-4318-b9c7-64b13b36ba40	ss_qr_aaecc74f59c771e6fe5fadb0713ac2694d990d568cedfaf29bd31957df837bcb	USED	2026-08-24 11:37:47.392	2026-08-24 11:37:47.391	2026-08-24 11:37:47.392	2026-08-24 11:37:47.392
7521f386-35a0-4150-bc42-bd676bfe9434	PASS-2026-3FFF44	SS26-COUPLE-B875	a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	74dfe834-aea0-4442-82cd-15faf9943dc5	ss_qr_6fddecae48d45607815c0b3b56d56e848c52d296673b037672614015321ec8e9	USED	2026-08-24 11:37:47.411	2026-08-24 11:37:47.41	2026-08-24 11:37:47.411	2026-08-24 11:37:47.411
92770b96-2098-4cbf-9910-05d5c3de83a3	PASS-2026-056AEC	SS26-COUPLE-25B0	a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	71288b58-62d4-4cae-9d89-83e3fc91aca6	ss_qr_f96fc534cb5fe4b241d30b4dbabb707610c194110dd80fd326234ce52ce30ef4	USED	2026-08-24 11:37:47.415	2026-08-24 11:37:47.415	2026-08-24 11:37:47.415	2026-08-24 11:37:47.415
242c60b8-d62c-4dcb-9036-4952c09d6167	PASS-2026-B6F195	SS26-GAZEBO-4681	10e8fa4c-6e7c-4d98-9ca3-759011269529	9b873340-d10d-4465-ba60-c8831b17a3b7	ss_qr_bdfa632db4e363d6debd76dafdeffd860dbea6ce4d501ea31c645d79dbce33c5	ACTIVE	2026-08-24 11:37:47.445	\N	2026-08-24 11:37:47.445	2026-08-24 11:37:47.445
5622ef18-7a0a-45b5-8361-1e716c2f17dd	PASS-2026-462B93	SS26-GAZEBO-961C	10e8fa4c-6e7c-4d98-9ca3-759011269529	a72eadd7-7e2d-4c20-8adf-be2a27df1140	ss_qr_1bf075e39656ac8f131de697c29be2d52fe28c6bd8e9ecd873af0fb8c39b5762	ACTIVE	2026-08-24 11:37:47.448	\N	2026-08-24 11:37:47.448	2026-08-24 11:37:47.448
d5ca1b0c-743f-4155-b2a1-57ee160f8d6b	PASS-2026-005C3F	SS26-GAZEBO-7F34	10e8fa4c-6e7c-4d98-9ca3-759011269529	6b939f39-a109-4ed4-b8f9-5f9cfc782ea3	ss_qr_ea89ed44ede6bd6cfa5d7d488b8075e1d50b5d78631a0c1281c310481917ca34	ACTIVE	2026-08-24 11:37:47.451	\N	2026-08-24 11:37:47.451	2026-08-24 11:37:47.451
d5c8452e-bfcd-4ce7-918b-4e20b992c426	PASS-2026-8F8224	SS26-GAZEBO-2F2C	1ede9d10-6eda-45ef-828e-ce36ccd50335	c8b2ca97-28f0-46e8-acb2-65babbe0b84a	ss_qr_cafe62303b6586152ce6ad225447040566aa1c8c05c0a20a5830001dbdced7ac	ACTIVE	2026-08-24 11:37:47.482	\N	2026-08-24 11:37:47.482	2026-08-24 11:37:47.482
d34d3804-6ba3-41c7-bfd6-c1a7510d7e6d	PASS-2026-FE674D	SS26-GAZEBO-501F	1ede9d10-6eda-45ef-828e-ce36ccd50335	91d0d488-6f35-4b85-ba4a-1ed4411a7e0b	ss_qr_3975c2d841e47fbe07fb9d7f40b12c75bcbb0ee2b68c8239a2016a7fd309d7f8	ACTIVE	2026-08-24 11:37:47.484	\N	2026-08-24 11:37:47.484	2026-08-24 11:37:47.484
f1d1a459-9674-4b9b-b8fb-1003fb05e0f0	PASS-2026-04F613	SS26-GAZEBO-A036	1ede9d10-6eda-45ef-828e-ce36ccd50335	19ca0bb7-3514-4a5e-a047-83d383bab26b	ss_qr_f21045756e227ca85365e9b523747c039004de627f5197855c4cb86c9cc4d4e1	ACTIVE	2026-08-24 11:37:47.486	\N	2026-08-24 11:37:47.486	2026-08-24 11:37:47.486
\.


--
-- Data for Name: Entry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Entry" (id, "eventId", "attendeeId", "registrationId", "credentialId", "entryType", "verificationMethod", "verifiedById", notes, "createdAt") FROM stdin;
cc0528d9-6070-48cc-9016-09d4f05d0043	3060ac34-2f98-4cc9-928c-bd5cffcab094	488cf082-8c88-47a9-86f9-efdb0e777962	e414bc08-79ae-4550-a83e-d378e567abe7	4a5dd9d3-d401-455d-ad3a-14ec8703a6a0	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:46.964
cbf97b39-9672-4bfb-a0ed-85d85681ef51	3060ac34-2f98-4cc9-928c-bd5cffcab094	145b95ec-8cb4-4136-ba94-d5c1487098f7	da146339-f00e-4060-993e-0e4c9b5f0b98	3b9106e2-e42b-47c5-956c-5eab4f8eaba0	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:46.99
e46995f1-265c-472b-9c55-d311fe35170e	3060ac34-2f98-4cc9-928c-bd5cffcab094	6edbf979-570c-48b8-84a7-25b55b92d096	3b802327-684f-44e9-894c-266fe9bc3fa7	e50223cc-d103-41ad-94a6-d9e4b59c1321	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.012
f729e496-d148-4753-8287-7b902e7476a3	3060ac34-2f98-4cc9-928c-bd5cffcab094	62aeff75-3276-46e7-b801-0a7b6088d853	d84935eb-4591-4228-bdfe-754b4f836512	75cbb946-5ea0-4b77-817b-5d3b7b762f18	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.03
6dbe2bd7-d129-4ce9-8dca-2b99ade994c0	3060ac34-2f98-4cc9-928c-bd5cffcab094	0eecd093-e618-47c1-b1f5-11589ee16f53	65981830-f445-4695-9eb8-7f9914e3849a	74ca4792-e0fa-4b4c-a279-f7024766e5ee	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.05
58212c9e-462d-42b5-913f-954d0c907f98	3060ac34-2f98-4cc9-928c-bd5cffcab094	6546d88b-437d-45fd-a292-d428351d29de	fa3ef199-eefc-4ee3-bd1b-8301834e7c74	180d257b-c8ee-405a-a331-511ce183f184	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.07
e4b19e7b-e987-4000-bab1-d45c9af913dd	3060ac34-2f98-4cc9-928c-bd5cffcab094	263f5594-8f8a-41e3-a641-20b57a0f0c9d	19e9c4c3-e633-4755-bd27-cf3f21ad39d3	9198adfa-a802-4e91-9c3a-16dea2f2afef	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.09
6dbc2a77-226a-44f9-871b-fa1807e84c9b	3060ac34-2f98-4cc9-928c-bd5cffcab094	80ce788d-afb5-4f40-b72f-dd5cde663f1b	08fa8e22-6ea7-409c-83d2-b4617fc7e9c3	dedf57ca-86e6-40de-be96-498f6a25e35a	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.112
b021ff8c-b39c-43d2-bd5f-ff153800a906	3060ac34-2f98-4cc9-928c-bd5cffcab094	d827e489-a44a-4efe-aea4-8974c180c18d	7c933f2c-3a2e-4989-8140-354d368d7b19	13507ea6-3d41-4909-9fbd-739c3dc3228a	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.132
7d390265-2a4d-4b12-993e-128f42a4aacd	3060ac34-2f98-4cc9-928c-bd5cffcab094	0a3f73ec-d434-4e82-bc23-1589b7cada50	741a9853-db5a-457c-94d9-14fb759aeb3a	4ca6d08f-a179-4ea4-b0ab-cb8c404cf920	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.15
188debbc-5e8b-47da-a82a-094a53f322e3	3060ac34-2f98-4cc9-928c-bd5cffcab094	0d823321-e69a-4f1e-896f-e4400b984546	46e19ebf-e200-4887-80fc-dffeaa6117a2	d4be80f1-2516-48ad-80a9-56e91bf406ff	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.366
90f127aa-3730-4c16-93e8-5d1d58e37333	3060ac34-2f98-4cc9-928c-bd5cffcab094	39301089-3e6e-42e7-a25d-28d692f03051	46e19ebf-e200-4887-80fc-dffeaa6117a2	9c1fba7c-3b89-410c-aab6-488dbfaa9c77	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.37
316793d6-28d1-4c96-b0c3-10d55423f324	3060ac34-2f98-4cc9-928c-bd5cffcab094	a0b0dfb3-3bef-4dd7-9386-6942e884b223	af5f38c0-5ce0-41a0-ab57-a692d3ef070a	cc80ec88-4bbe-4af3-8201-26dbfe4397c0	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.389
50432251-ed05-4fc0-8a29-1ff528698501	3060ac34-2f98-4cc9-928c-bd5cffcab094	88511bf3-a7d7-4318-b9c7-64b13b36ba40	af5f38c0-5ce0-41a0-ab57-a692d3ef070a	6895c5f1-da4c-4a8f-bcfb-b86689f55e51	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.394
4d5be946-6ff9-4c1a-add5-bc5cced4fbad	3060ac34-2f98-4cc9-928c-bd5cffcab094	74dfe834-aea0-4442-82cd-15faf9943dc5	a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	7521f386-35a0-4150-bc42-bd676bfe9434	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.413
4d24c323-dd36-40ff-9882-1dacbea5c5e5	3060ac34-2f98-4cc9-928c-bd5cffcab094	71288b58-62d4-4cae-9d89-83e3fc91aca6	a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	92770b96-2098-4cbf-9910-05d5c3de83a3	QR	QR_SCAN	1e1b2563-468f-4b9a-9612-c05e43b519a3	\N	2026-08-24 11:37:47.418
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Event" (id, name, "eventDate", status, "createdAt", "updatedAt") FROM stdin;
3060ac34-2f98-4cc9-928c-bd5cffcab094	Safed Sheri 2026	2026-10-09 18:00:00	ACTIVE	2026-08-24 11:37:46.637	2026-08-24 11:37:46.637
\.


--
-- Data for Name: Gazebo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Gazebo" (id, "gazeboNumber", level, price, status, "createdAt", "updatedAt") FROM stdin;
9f91b206-5a8d-419b-a4d1-60ac2f2cbfd8	GZB-L1-03	1	85000.00	AVAILABLE	2026-08-24 11:37:46.661	2026-08-24 11:37:46.661
f529fb66-c748-44d0-9486-ceb15325b5a3	GZB-L1-04	1	85000.00	AVAILABLE	2026-08-24 11:37:46.664	2026-08-24 11:37:46.664
e44f6c73-5b96-4650-a57b-3ef1e6680b21	GZB-L2-01	2	100000.00	AVAILABLE	2026-08-24 11:37:46.665	2026-08-24 11:37:46.665
b11a510f-9ff7-4d66-92f0-9388dc300ad7	GZB-L2-02	2	100000.00	AVAILABLE	2026-08-24 11:37:46.667	2026-08-24 11:37:46.667
c2024860-e43b-4edc-bdaf-990d97d8fe04	GZB-L2-03	2	100000.00	AVAILABLE	2026-08-24 11:37:46.669	2026-08-24 11:37:46.669
899cabea-ca16-4b22-8634-1cf6e3c2b7ae	GZB-L2-04	2	100000.00	AVAILABLE	2026-08-24 11:37:46.672	2026-08-24 11:37:46.672
bddeb2bd-52f0-4960-aa71-97827a5ac67f	GZB-L3-01	3	125000.00	AVAILABLE	2026-08-24 11:37:46.673	2026-08-24 11:37:46.673
d281212c-a90b-4895-8903-f5044c8349dd	GZB-L3-02	3	125000.00	AVAILABLE	2026-08-24 11:37:46.675	2026-08-24 11:37:46.675
58cb8662-df7a-4563-ac7c-6b8607874b19	GZB-L3-03	3	125000.00	AVAILABLE	2026-08-24 11:37:46.677	2026-08-24 11:37:46.677
34d12a3d-28fb-4a21-a055-2fe8660e7bae	GZB-L3-04	3	125000.00	AVAILABLE	2026-08-24 11:37:46.678	2026-08-24 11:37:46.678
049a88cc-4388-4b91-91e6-3cf98b4a7f51	GZB-L1-01	1	85000.00	CONFIRMED	2026-08-24 11:37:46.656	2026-08-24 11:37:47.454
98acdbd4-6d01-436b-b17e-a58e419702b8	GZB-L1-02	1	85000.00	CONFIRMED	2026-08-24 11:37:46.659	2026-08-24 11:37:47.488
\.


--
-- Data for Name: GazeboInquiry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GazeboInquiry" (id, "inquiryNumber", "gazeboId", level, "fullName", phone, notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "registrationId", "paymentLocationId", "collectedById", amount, method, status, "receiptNumber", provider, "providerReference", "paymentLinkId", notes, "failureReason", "createdAt", "updatedAt") FROM stdin;
32b9ce0a-ea27-44b4-8ffc-ee9d6d6575bc	3e797c61-2629-4a47-9356-642d7499f406	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2101	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-101	\N	\N	\N	2026-08-24 11:37:46.7	2026-08-24 11:37:46.7
f8fa2758-dd79-4339-bdcb-072221dc1afd	16efb7a8-64da-46f9-8a5b-e45c29a1912d	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2102	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-102	\N	\N	\N	2026-08-24 11:37:46.716	2026-08-24 11:37:46.716
7f3eb085-8c3a-43ef-bc91-5da4ccc282db	bbd8110c-9eb5-44c1-acf2-92b91c977ec0	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2103	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-103	\N	\N	\N	2026-08-24 11:37:46.743	2026-08-24 11:37:46.743
840fb62d-e2c4-48e1-a2f2-d34643d5e74c	9c0bfc70-2bfc-436d-8749-db7ed8b262bb	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2104	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-104	\N	\N	\N	2026-08-24 11:37:46.762	2026-08-24 11:37:46.762
73c7a4eb-f3bb-4edc-9f77-ebb3e328b4d5	83199275-c93f-4e7c-9728-c7721f0aa76d	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2105	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-105	\N	\N	\N	2026-08-24 11:37:46.779	2026-08-24 11:37:46.779
915b7ecf-68bd-454b-92c1-3cd9e0061070	6f12622e-2914-45c6-90e7-32070f3814f9	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2106	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-106	\N	\N	\N	2026-08-24 11:37:46.801	2026-08-24 11:37:46.801
819d97da-f193-4054-9d60-12e7c61ee234	fd932af8-f4c6-43d8-8678-53467a39d39a	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2107	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-107	\N	\N	\N	2026-08-24 11:37:46.816	2026-08-24 11:37:46.816
241d9d59-b3f6-4154-8259-3063ee2d35b5	608d6706-1c07-46a5-bd7a-d1aff4579229	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2108	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-108	\N	\N	\N	2026-08-24 11:37:46.829	2026-08-24 11:37:46.829
c13e984b-f3fb-4042-978b-b745ff188691	98169fa1-f3bf-4020-b257-6da0a8e1ae90	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2109	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-109	\N	\N	\N	2026-08-24 11:37:46.847	2026-08-24 11:37:46.847
e70a70b0-8b82-421a-b50e-e143357103f9	782ea22e-fb6d-48aa-84f6-2beaceccb77a	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2110	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-110	\N	\N	\N	2026-08-24 11:37:46.862	2026-08-24 11:37:46.862
c7bb0975-334c-4341-b0d8-cfb973c8585a	13e744e3-2e9c-4fb6-b6ad-eb4b8aed4889	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2111	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-111	\N	\N	\N	2026-08-24 11:37:46.878	2026-08-24 11:37:46.878
4388cb9b-e876-416d-9885-300f7b310467	f12a1fca-c2e1-47b3-847a-4bb43d7906ba	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2112	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-112	\N	\N	\N	2026-08-24 11:37:46.895	2026-08-24 11:37:46.895
01c3a23c-8a45-47d8-b46f-345fc21a80ce	750ed2b5-c276-4b33-9379-1896e6a9d899	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2113	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-113	\N	\N	\N	2026-08-24 11:37:46.911	2026-08-24 11:37:46.911
e1120119-5a8f-4416-8dca-93469acad172	7ede1f9a-def6-4b65-97e8-714072d88597	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2114	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-114	\N	\N	\N	2026-08-24 11:37:46.928	2026-08-24 11:37:46.928
0178c042-c6b1-443f-b3d0-c6b4702a1c0f	7ae9d48f-4111-40a6-9933-5e142c736501	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2115	SAFED_SHERI_GATEWAY	PG-TXN-ACTIVE-115	\N	\N	\N	2026-08-24 11:37:46.943	2026-08-24 11:37:46.943
250f8f46-ced5-421d-81dc-69626c44ae38	e414bc08-79ae-4550-a83e-d378e567abe7	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2116	SAFED_SHERI_GATEWAY	PG-TXN-USED-116	\N	\N	\N	2026-08-24 11:37:46.958	2026-08-24 11:37:46.958
413507d6-5286-450f-8584-49a893b44e6d	da146339-f00e-4060-993e-0e4c9b5f0b98	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2117	SAFED_SHERI_GATEWAY	PG-TXN-USED-117	\N	\N	\N	2026-08-24 11:37:46.984	2026-08-24 11:37:46.984
2213b76c-0452-4fb5-85d5-cc1a7fc9bcca	3b802327-684f-44e9-894c-266fe9bc3fa7	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2118	SAFED_SHERI_GATEWAY	PG-TXN-USED-118	\N	\N	\N	2026-08-24 11:37:47.007	2026-08-24 11:37:47.007
4cb276ad-91d4-4c35-9a9d-ba63a3b04d5f	d84935eb-4591-4228-bdfe-754b4f836512	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2119	SAFED_SHERI_GATEWAY	PG-TXN-USED-119	\N	\N	\N	2026-08-24 11:37:47.026	2026-08-24 11:37:47.026
e8320e9c-db68-46b5-a6d7-678fbbe433c7	65981830-f445-4695-9eb8-7f9914e3849a	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2120	SAFED_SHERI_GATEWAY	PG-TXN-USED-120	\N	\N	\N	2026-08-24 11:37:47.046	2026-08-24 11:37:47.046
4912ad8b-3e66-443f-83b5-ba75d161bdb0	fa3ef199-eefc-4ee3-bd1b-8301834e7c74	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2121	SAFED_SHERI_GATEWAY	PG-TXN-USED-121	\N	\N	\N	2026-08-24 11:37:47.065	2026-08-24 11:37:47.065
f7434a16-620e-4950-9a2f-798c4d8e369e	19e9c4c3-e633-4755-bd27-cf3f21ad39d3	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2122	SAFED_SHERI_GATEWAY	PG-TXN-USED-122	\N	\N	\N	2026-08-24 11:37:47.084	2026-08-24 11:37:47.084
b0af46e2-c57f-40c4-8d60-25a53dc24d85	08fa8e22-6ea7-409c-83d2-b4617fc7e9c3	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2123	SAFED_SHERI_GATEWAY	PG-TXN-USED-123	\N	\N	\N	2026-08-24 11:37:47.105	2026-08-24 11:37:47.105
f9794411-09f1-43f6-b0a4-f34018c0158d	7c933f2c-3a2e-4989-8140-354d368d7b19	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2124	SAFED_SHERI_GATEWAY	PG-TXN-USED-124	\N	\N	\N	2026-08-24 11:37:47.128	2026-08-24 11:37:47.128
1d164b7e-3228-4a10-816b-5d94922d1e12	741a9853-db5a-457c-94d9-14fb759aeb3a	\N	\N	3500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2125	SAFED_SHERI_GATEWAY	PG-TXN-USED-125	\N	\N	\N	2026-08-24 11:37:47.146	2026-08-24 11:37:47.146
f8da8045-2711-4c73-84b5-244459f03be0	81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2126	SAFED_SHERI_GATEWAY	PG-TXN-CPL-126	\N	\N	\N	2026-08-24 11:37:47.169	2026-08-24 11:37:47.169
a2129238-251f-4661-a7ad-70c989352e79	fdbe78c5-c4eb-440d-8614-df0754f98b66	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2127	SAFED_SHERI_GATEWAY	PG-TXN-CPL-127	\N	\N	\N	2026-08-24 11:37:47.193	2026-08-24 11:37:47.193
db059f69-dd58-4010-9750-2f9ff99b29d3	4287d3cc-2fe6-4d89-b210-611dfed151e8	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2128	SAFED_SHERI_GATEWAY	PG-TXN-CPL-128	\N	\N	\N	2026-08-24 11:37:47.22	2026-08-24 11:37:47.22
0916f6b5-11b2-4a66-be47-422089103c0c	2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2129	SAFED_SHERI_GATEWAY	PG-TXN-CPL-129	\N	\N	\N	2026-08-24 11:37:47.239	2026-08-24 11:37:47.239
7a8fa288-b56d-4a80-a781-bcf4b901bd5f	db8d3992-1bb3-4f88-b164-de033ba3a7f9	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2130	SAFED_SHERI_GATEWAY	PG-TXN-CPL-130	\N	\N	\N	2026-08-24 11:37:47.262	2026-08-24 11:37:47.262
38997608-1bfe-439b-a96d-3536d842afc2	3a6cb924-bff0-4774-8c25-9c0f6e82898c	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2131	SAFED_SHERI_GATEWAY	PG-TXN-CPL-131	\N	\N	\N	2026-08-24 11:37:47.287	2026-08-24 11:37:47.287
2d578690-2844-457c-bdbf-b2bf8f4e2b82	46599cfa-2de4-429e-a5db-c3d1e806509c	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2132	SAFED_SHERI_GATEWAY	PG-TXN-CPL-132	\N	\N	\N	2026-08-24 11:37:47.311	2026-08-24 11:37:47.311
96b3df3b-b9f2-4b2f-8372-2eb419e52e63	f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2133	SAFED_SHERI_GATEWAY	PG-TXN-CPL-133	\N	\N	\N	2026-08-24 11:37:47.34	2026-08-24 11:37:47.34
bd5c9590-28b7-4003-9b4f-1258770f29a1	46e19ebf-e200-4887-80fc-dffeaa6117a2	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2134	SAFED_SHERI_GATEWAY	PG-TXN-CPL-USED-134	\N	\N	\N	2026-08-24 11:37:47.362	2026-08-24 11:37:47.362
6477538a-18b3-4948-8949-af4dc24485c7	af5f38c0-5ce0-41a0-ab57-a692d3ef070a	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2135	SAFED_SHERI_GATEWAY	PG-TXN-CPL-USED-135	\N	\N	\N	2026-08-24 11:37:47.384	2026-08-24 11:37:47.384
249d5131-4ca7-42fc-ad5c-639306ab0153	a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	\N	\N	6500.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2136	SAFED_SHERI_GATEWAY	PG-TXN-CPL-USED-136	\N	\N	\N	2026-08-24 11:37:47.409	2026-08-24 11:37:47.409
a17a689d-da56-422b-90fb-7e3978325a98	10e8fa4c-6e7c-4d98-9ca3-759011269529	\N	\N	85000.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2137	SAFED_SHERI_GATEWAY	PG-TXN-GZB-137	\N	\N	\N	2026-08-24 11:37:47.442	2026-08-24 11:37:47.442
8982cbf6-741e-41d2-9d03-0273ffab0ed0	1ede9d10-6eda-45ef-828e-ce36ccd50335	\N	\N	85000.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-2138	SAFED_SHERI_GATEWAY	PG-TXN-GZB-138	\N	\N	\N	2026-08-24 11:37:47.48	2026-08-24 11:37:47.48
cf94fef4-e569-4c53-a3c0-e580ec8ae644	56effa19-8f4c-45c7-b537-89561b9f91f3	\N	\N	3500.00	ONLINE_GATEWAY	FAILED	RCP-2026-FAIL-182	SAFED_SHERI_GATEWAY	PG-TXN-FAIL-182	\N	\N	Bank network timeout or insufficient funds during authentication	2026-08-24 11:37:47.87	2026-08-24 11:37:47.87
c3e3d64c-d7de-436f-ab0d-57fc7b36fa25	568578dc-37ce-4e1d-bd5b-18a961015fee	\N	\N	3500.00	ONLINE_GATEWAY	FAILED	RCP-2026-FAIL-183	SAFED_SHERI_GATEWAY	PG-TXN-FAIL-183	\N	\N	Bank network timeout or insufficient funds during authentication	2026-08-24 11:37:47.882	2026-08-24 11:37:47.882
5506259e-06b0-49c2-8fcd-56ee0826f7c5	dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	\N	\N	1200.00	ONLINE_GATEWAY	CONFIRMED	RCP-2026-1041	SAFED_SHERI_ONLINE_UPI_GATEWAY	pay_TTazjRXocgTt77	paylink_b23cc9330fad87059916b1b871fba81e	Razorpay Order ID: order_TTazabuNcFfqT9	\N	2026-08-24 11:47:52.478	2026-08-24 11:47:52.478
\.


--
-- Data for Name: PaymentLocation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentLocation" (id, name, address, "isActive", "createdAt", "updatedAt") FROM stdin;
4576a605-0de5-4e8f-a240-96c55fb81338	Club O7 Box Office Counter A	Shela, Ahmedabad, Gujarat	t	2026-08-24 11:37:46.653	2026-08-24 11:37:46.653
\.


--
-- Data for Name: PricingPhase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PricingPhase" (id, "phaseName", "singlePrice", "couplePrice", "nextSinglePrice", "nextCouplePrice", "showSinglePrice", "showCouplePrice", "showGazeboPrice", "isCountdownActive", "countdownTarget", "urgencyTagline", "hiddenPriceLabel", "isActive", "createdAt", "updatedAt") FROM stdin;
4186230d-b09e-443c-9a5d-fb040f661060	EARLY_BIRD	3500.00	6500.00	\N	\N	t	t	f	f	\N	\N	Price Revealed on Approval	t	2026-08-24 11:37:46.64	2026-08-24 11:37:46.64
90cba776-6a0e-4e33-862c-0957af50331a	REGULAR	4500.00	8500.00	\N	\N	t	t	f	f	\N	\N	Price Revealed on Approval	f	2026-08-24 11:37:46.643	2026-08-24 11:37:46.643
\.


--
-- Data for Name: Registration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Registration" (id, "registrationNumber", "eventId", "pricingPhaseId", "passType", status, "amountDue", "paymentLinkId", "reviewNotes", "reviewedById", "reviewedAt", "createdById", "createdAt", "updatedAt") FROM stdin;
3e797c61-2629-4a47-9356-642d7499f406	SS-2026-000101	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_ca3209e5c3ea7bb2	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.692	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.693	2026-08-24 11:37:46.693
16efb7a8-64da-46f9-8a5b-e45c29a1912d	SS-2026-000102	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_d6cc9fb89ff78a24	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.711	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.712	2026-08-24 11:37:46.712
bbd8110c-9eb5-44c1-acf2-92b91c977ec0	SS-2026-000103	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_dd822934b6aa7eb9	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.73	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.731	2026-08-24 11:37:46.731
9c0bfc70-2bfc-436d-8749-db7ed8b262bb	SS-2026-000104	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_e88ca5752c0c0df1	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.757	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.757	2026-08-24 11:37:46.757
83199275-c93f-4e7c-9728-c7721f0aa76d	SS-2026-000105	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_b34ab14f68df1807	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.774	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.775	2026-08-24 11:37:46.775
6f12622e-2914-45c6-90e7-32070f3814f9	SS-2026-000106	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_62c26b27a2e2d09b	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.796	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.797	2026-08-24 11:37:46.797
fd932af8-f4c6-43d8-8678-53467a39d39a	SS-2026-000107	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_560f46f85b142757	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.81	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.811	2026-08-24 11:37:46.811
608d6706-1c07-46a5-bd7a-d1aff4579229	SS-2026-000108	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_26533473b5252832	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.825	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.825	2026-08-24 11:37:46.825
98169fa1-f3bf-4020-b257-6da0a8e1ae90	SS-2026-000109	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_601a082a385419f4	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.842	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.843	2026-08-24 11:37:46.843
782ea22e-fb6d-48aa-84f6-2beaceccb77a	SS-2026-000110	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_1973163b1e36817e	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.857	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.858	2026-08-24 11:37:46.858
13e744e3-2e9c-4fb6-b6ad-eb4b8aed4889	SS-2026-000111	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_dbc3da964576c946	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.871	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.872	2026-08-24 11:37:46.872
f12a1fca-c2e1-47b3-847a-4bb43d7906ba	SS-2026-000112	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_52adb98e75fdec82	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.888	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.89	2026-08-24 11:37:46.89
750ed2b5-c276-4b33-9379-1896e6a9d899	SS-2026-000113	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_1e521fe6877d3630	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.905	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.905	2026-08-24 11:37:46.905
7ede1f9a-def6-4b65-97e8-714072d88597	SS-2026-000114	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_b68a50c81334fd1a	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.922	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.923	2026-08-24 11:37:46.923
7ae9d48f-4111-40a6-9933-5e142c736501	SS-2026-000115	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_d402e20a0499812b	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.937	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.938	2026-08-24 11:37:46.938
e414bc08-79ae-4550-a83e-d378e567abe7	SS-2026-000116	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_68222e4a64fb9de3	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.95	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.951	2026-08-24 11:37:46.951
da146339-f00e-4060-993e-0e4c9b5f0b98	SS-2026-000117	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_dc7663e1de615922	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.978	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:46.979	2026-08-24 11:37:46.979
3b802327-684f-44e9-894c-266fe9bc3fa7	SS-2026-000118	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_fd95cd5cddf8555e	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47	2026-08-24 11:37:47
d84935eb-4591-4228-bdfe-754b4f836512	SS-2026-000119	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_5bdcd76ae7328644	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.02	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.021	2026-08-24 11:37:47.021
65981830-f445-4695-9eb8-7f9914e3849a	SS-2026-000120	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_d07051401e410c06	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.04	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.041	2026-08-24 11:37:47.041
fa3ef199-eefc-4ee3-bd1b-8301834e7c74	SS-2026-000121	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_6902e5a1dbef3b90	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.06	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.061	2026-08-24 11:37:47.061
19e9c4c3-e633-4755-bd27-cf3f21ad39d3	SS-2026-000122	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_249414e5a55aa4a0	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.079	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.08	2026-08-24 11:37:47.08
08fa8e22-6ea7-409c-83d2-b4617fc7e9c3	SS-2026-000123	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_7b4dfa843a56346d	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.098	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.099	2026-08-24 11:37:47.099
7c933f2c-3a2e-4989-8140-354d368d7b19	SS-2026-000124	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_3683f832bddf708b	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.121	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.123	2026-08-24 11:37:47.123
741a9853-db5a-457c-94d9-14fb759aeb3a	SS-2026-000125	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PASS_ISSUED	3500.00	paylink_a54d50c66483e420	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.141	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.142	2026-08-24 11:37:47.142
81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	SS-2026-000126	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_5d05b86d3cf4be2b	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.164	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.164	2026-08-24 11:37:47.164
dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	SS-2026-000184	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	KIDS	PASS_ISSUED	1200.00	paylink_b23cc9330fad87059916b1b871fba81e	All attendees approved by Admin.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:47:15.518	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:40:30.745	2026-08-24 11:47:52.5
fdbe78c5-c4eb-440d-8614-df0754f98b66	SS-2026-000127	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_74c93d12cfdc47c9	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.185	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.186	2026-08-24 11:37:47.186
4287d3cc-2fe6-4d89-b210-611dfed151e8	SS-2026-000128	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_8560911a002bc0fb	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.213	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.214	2026-08-24 11:37:47.214
2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	SS-2026-000129	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_b3f113dea751745c	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.233	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.233	2026-08-24 11:37:47.233
db8d3992-1bb3-4f88-b164-de033ba3a7f9	SS-2026-000130	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_7b6c43fe164691db	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.256	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.257	2026-08-24 11:37:47.257
3a6cb924-bff0-4774-8c25-9c0f6e82898c	SS-2026-000131	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_26b49923c4fb4754	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.278	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.282	2026-08-24 11:37:47.282
46599cfa-2de4-429e-a5db-c3d1e806509c	SS-2026-000132	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_f6d2af010e1513d9	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.305	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.306	2026-08-24 11:37:47.306
f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	SS-2026-000133	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_c78f048b60e413b2	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.331	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.331	2026-08-24 11:37:47.331
46e19ebf-e200-4887-80fc-dffeaa6117a2	SS-2026-000134	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_8d4d48185651ca4e	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.357	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.358	2026-08-24 11:37:47.358
af5f38c0-5ce0-41a0-ab57-a692d3ef070a	SS-2026-000135	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_11293033198a503e	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.38	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.38	2026-08-24 11:37:47.38
a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	SS-2026-000136	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	COUPLE	PASS_ISSUED	6500.00	paylink_86262bf208313313	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.403	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.404	2026-08-24 11:37:47.404
10e8fa4c-6e7c-4d98-9ca3-759011269529	SS-2026-000137	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	GAZEBO	PASS_ISSUED	85000.00	paylink_df2c07e1c4815d8c	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.435	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.436	2026-08-24 11:37:47.436
1ede9d10-6eda-45ef-828e-ce36ccd50335	SS-2026-000138	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	GAZEBO	PASS_ISSUED	85000.00	paylink_7db980f7443e7211	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.473	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.474	2026-08-24 11:37:47.474
e7f98a72-73f1-42eb-b646-d9b8e73cd6fb	SS-2026-000139	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_b007d6e1df61c569	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.496	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.497	2026-08-24 11:37:47.497
55814a86-67d7-45db-a89d-321c3110acce	SS-2026-000140	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_d8999b9bcb183286	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.505	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.506	2026-08-24 11:37:47.506
41e3234c-a1f2-4b58-978b-6e576dbd0426	SS-2026-000141	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_046868a166c8da2d	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.514	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.515	2026-08-24 11:37:47.515
be3e05e7-629f-41ed-bfb3-be1ef4fccd4d	SS-2026-000142	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_a45907152de6e82c	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.523	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.524	2026-08-24 11:37:47.524
7dde533d-dc0b-4b52-b240-2411c6a9f153	SS-2026-000143	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_7353e60ac3cadf06	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.53	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.531	2026-08-24 11:37:47.531
9bbf90cf-b597-4ab1-b0df-906fd7f9b13e	SS-2026-000144	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_f3a7ae8bdbd80d69	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.539	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.54	2026-08-24 11:37:47.54
ed44c96f-7c9b-42a9-a4a3-8384c1315278	SS-2026-000145	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_0e93bdb5ea19f97b	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.547	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.548	2026-08-24 11:37:47.548
df6c80f8-d894-41db-ab31-309852b7a990	SS-2026-000146	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_f9b76f4adb8fddf3	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.555	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.556	2026-08-24 11:37:47.556
33db54f5-71d1-4cf6-a646-88e176f014f0	SS-2026-000147	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_456b9bfba5bc1170	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.563	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.564	2026-08-24 11:37:47.564
8ee804df-531a-47e2-8915-4774afc8b916	SS-2026-000148	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_bba7b3654b4786cc	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.57	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.571	2026-08-24 11:37:47.571
e1d21deb-0e62-45e9-aed6-01770a111d62	SS-2026-000149	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_f7e071f218ab2c01	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.578	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.579	2026-08-24 11:37:47.579
873035ba-169f-49b9-9dc4-4a84be8329a9	SS-2026-000150	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_b8b2b2827469264d	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.586	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.587	2026-08-24 11:37:47.587
e070f4c0-8816-4de5-90b9-2c31b6c66154	SS-2026-000151	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_26853dfb9e3ae330	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.596	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.596	2026-08-24 11:37:47.596
5e3c3cc7-407e-4bce-b712-1b76555c3ed3	SS-2026-000152	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_94eaafe92a9e7bf1	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.604	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.605	2026-08-24 11:37:47.605
717efd71-f0b7-4b22-9163-6d01d533ac92	SS-2026-000153	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_PENDING	3500.00	paylink_4cbd74b1ecc68d92	Verified Aadhaar documents. Approved for payment.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.616	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.617	2026-08-24 11:37:47.617
cabcc9f3-0efe-4a2c-81d0-cb8cf0062b84	SS-2026-000154	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.625	2026-08-24 11:37:47.625
0fdd044b-51c2-41b0-b0e1-2ba65475ac26	SS-2026-000155	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.634	2026-08-24 11:37:47.634
3a895f19-31bf-4618-935e-c101f376ecf3	SS-2026-000156	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.642	2026-08-24 11:37:47.642
661607f9-a141-4e3d-94b8-43f73c5dee19	SS-2026-000157	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.649	2026-08-24 11:37:47.649
7d6706f9-6221-4d8d-a0d7-afcfb04234d2	SS-2026-000158	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.657	2026-08-24 11:37:47.657
b7d013cd-fff5-48d9-9a32-229de40b2c6d	SS-2026-000159	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.664	2026-08-24 11:37:47.664
9649038f-3080-4a68-8c60-47511ad0b14a	SS-2026-000160	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.672	2026-08-24 11:37:47.672
59430714-fc01-4058-aab0-3097d9810cfb	SS-2026-000161	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.681	2026-08-24 11:37:47.681
d1a5cf8e-46c2-4827-a19e-7209327e4173	SS-2026-000162	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.69	2026-08-24 11:37:47.69
34d06c77-839d-410b-b4db-50051a6b2133	SS-2026-000163	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.7	2026-08-24 11:37:47.7
903e524e-6d37-4625-857d-30fa6ae2f84e	SS-2026-000164	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.709	2026-08-24 11:37:47.709
1bffbd38-aa29-480d-a9a0-1a9879aa6cb7	SS-2026-000165	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.716	2026-08-24 11:37:47.716
f176c22c-a0df-45a6-bfb1-e9ba1d8a230f	SS-2026-000166	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.724	2026-08-24 11:37:47.724
7ed38af3-f560-42dd-8c8c-9f22219b87d6	SS-2026-000167	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.732	2026-08-24 11:37:47.732
5b9bac04-83a6-4453-bc40-f2aca1db38b7	SS-2026-000168	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	UNDER_REVIEW	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.741	2026-08-24 11:37:47.741
cca57dfa-2e9b-4abd-a099-040e8c29d6f6	SS-2026-000169	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.748	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.749	2026-08-24 11:37:47.749
41bdc582-a7d6-4f2a-b610-180071957164	SS-2026-000170	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.757	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.758	2026-08-24 11:37:47.758
ea606f7d-ed67-4005-b577-c6fda3a7b4b8	SS-2026-000171	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.769	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.77	2026-08-24 11:37:47.77
3985cab0-06b4-47a1-b541-04dd6fd4af3c	SS-2026-000172	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.777	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.778	2026-08-24 11:37:47.778
0dd71fdf-5272-4307-8106-c99b224bb402	SS-2026-000173	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.786	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.787	2026-08-24 11:37:47.787
75617195-bd22-4580-953a-0f1a7a054672	SS-2026-000174	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.795	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.795	2026-08-24 11:37:47.795
677ef96c-28f2-459d-b5e3-2b958a7596cc	SS-2026-000175	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.804	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.805	2026-08-24 11:37:47.805
e2c44222-5c45-4fd0-aed9-2bcc5db16e10	SS-2026-000176	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	REJECTED	3500.00	\N	Blurred Aadhaar document image. Please re-apply with a high-clarity document.	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.812	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.812	2026-08-24 11:37:47.812
5453c775-cd55-4150-8282-d42e6814b265	SS-2026-000177	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	CANCELLED	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.822	2026-08-24 11:37:47.822
1c9321b3-427b-4477-a9f7-30b8af6bc390	SS-2026-000178	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	CANCELLED	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.83	2026-08-24 11:37:47.83
423d7e89-eadf-4553-8945-045c0e58846c	SS-2026-000179	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	CANCELLED	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.84	2026-08-24 11:37:47.84
32425ca8-52bb-4a51-bba1-38119bc2d40c	SS-2026-000180	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	CANCELLED	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.85	2026-08-24 11:37:47.85
70a93ddb-0840-46a3-a051-20a262de3c57	SS-2026-000181	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	CANCELLED	3500.00	\N	\N	\N	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.857	2026-08-24 11:37:47.857
56effa19-8f4c-45c7-b537-89561b9f91f3	SS-2026-000182	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_FAILED	3500.00	paylink_edb68488bcb07e54	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.865	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.866	2026-08-24 11:37:47.866
568578dc-37ce-4e1d-bd5b-18a961015fee	SS-2026-000183	3060ac34-2f98-4cc9-928c-bd5cffcab094	4186230d-b09e-443c-9a5d-fb040f661060	SINGLE	PAYMENT_FAILED	3500.00	paylink_cd323860a421b1e2	\N	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.876	761a2b29-f2ed-4b53-af34-b0754012fad8	2026-08-24 11:37:47.877	2026-08-24 11:37:47.877
\.


--
-- Data for Name: RegistrationAttendee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RegistrationAttendee" ("registrationId", "attendeeId", "isPrimary", status, "reviewNotes", "reviewedAt") FROM stdin;
dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	76843426-6af2-4b19-8f0d-5367d65e34eb	t	APPROVED	\N	2026-08-24 11:47:15.303
dcb7e1f0-4b76-4397-9413-2f165d7bc5a1	964b84a6-ad92-4b5b-bbfd-e22961b63ef0	f	APPROVED	\N	2026-08-24 11:47:15.306
3e797c61-2629-4a47-9356-642d7499f406	b89062d8-95b2-4dc8-ac56-6916a0af4c1e	t	SUBMITTED	\N	\N
16efb7a8-64da-46f9-8a5b-e45c29a1912d	5a64017a-6a57-4f7e-a882-2fdc4c315983	t	SUBMITTED	\N	\N
bbd8110c-9eb5-44c1-acf2-92b91c977ec0	9b929bd7-324d-4eea-b179-396104fab46d	t	SUBMITTED	\N	\N
9c0bfc70-2bfc-436d-8749-db7ed8b262bb	6c4040dc-a35c-48b6-b023-91e714ea266f	t	SUBMITTED	\N	\N
83199275-c93f-4e7c-9728-c7721f0aa76d	1b81be44-7216-464f-8ba6-f81359acd345	t	SUBMITTED	\N	\N
6f12622e-2914-45c6-90e7-32070f3814f9	6b5e9370-6196-4c44-8ddb-d6d80ba4ad29	t	SUBMITTED	\N	\N
fd932af8-f4c6-43d8-8678-53467a39d39a	aa9e6fff-daba-4bfc-8ed9-98b32ff086a9	t	SUBMITTED	\N	\N
608d6706-1c07-46a5-bd7a-d1aff4579229	373c58f8-e659-435a-b40e-1d055b0533ca	t	SUBMITTED	\N	\N
98169fa1-f3bf-4020-b257-6da0a8e1ae90	10ea55b6-0309-4988-8d2c-2229e3176707	t	SUBMITTED	\N	\N
782ea22e-fb6d-48aa-84f6-2beaceccb77a	69316941-f21f-4385-95a6-0348b7befb3b	t	SUBMITTED	\N	\N
13e744e3-2e9c-4fb6-b6ad-eb4b8aed4889	4a3f4b26-47cf-4a5e-afb1-2dcbf19d06b9	t	SUBMITTED	\N	\N
f12a1fca-c2e1-47b3-847a-4bb43d7906ba	c1608127-72a9-47b3-bc61-52d83b14c7a3	t	SUBMITTED	\N	\N
750ed2b5-c276-4b33-9379-1896e6a9d899	f242dc20-c343-443e-a234-ecdaaff1ddc1	t	SUBMITTED	\N	\N
7ede1f9a-def6-4b65-97e8-714072d88597	b15e392a-86a4-4808-843c-e501dd83ed02	t	SUBMITTED	\N	\N
7ae9d48f-4111-40a6-9933-5e142c736501	7affed51-2c81-48b1-b122-5be6a8081ce1	t	SUBMITTED	\N	\N
e414bc08-79ae-4550-a83e-d378e567abe7	488cf082-8c88-47a9-86f9-efdb0e777962	t	SUBMITTED	\N	\N
da146339-f00e-4060-993e-0e4c9b5f0b98	145b95ec-8cb4-4136-ba94-d5c1487098f7	t	SUBMITTED	\N	\N
3b802327-684f-44e9-894c-266fe9bc3fa7	6edbf979-570c-48b8-84a7-25b55b92d096	t	SUBMITTED	\N	\N
d84935eb-4591-4228-bdfe-754b4f836512	62aeff75-3276-46e7-b801-0a7b6088d853	t	SUBMITTED	\N	\N
65981830-f445-4695-9eb8-7f9914e3849a	0eecd093-e618-47c1-b1f5-11589ee16f53	t	SUBMITTED	\N	\N
fa3ef199-eefc-4ee3-bd1b-8301834e7c74	6546d88b-437d-45fd-a292-d428351d29de	t	SUBMITTED	\N	\N
19e9c4c3-e633-4755-bd27-cf3f21ad39d3	263f5594-8f8a-41e3-a641-20b57a0f0c9d	t	SUBMITTED	\N	\N
08fa8e22-6ea7-409c-83d2-b4617fc7e9c3	80ce788d-afb5-4f40-b72f-dd5cde663f1b	t	SUBMITTED	\N	\N
7c933f2c-3a2e-4989-8140-354d368d7b19	d827e489-a44a-4efe-aea4-8974c180c18d	t	SUBMITTED	\N	\N
741a9853-db5a-457c-94d9-14fb759aeb3a	0a3f73ec-d434-4e82-bc23-1589b7cada50	t	SUBMITTED	\N	\N
81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	d866f99d-317d-440d-8160-78614bae9b70	t	SUBMITTED	\N	\N
81c9f96a-5fa4-4b27-9e70-e10b4dacf7d8	8822bea3-95db-4ddd-9a04-34273b7ad6e3	f	SUBMITTED	\N	\N
fdbe78c5-c4eb-440d-8614-df0754f98b66	59a1cf1f-9a0b-425e-8917-8cd5e20951b8	t	SUBMITTED	\N	\N
fdbe78c5-c4eb-440d-8614-df0754f98b66	acb3fc34-51aa-428b-9b32-1e5c51fa79a1	f	SUBMITTED	\N	\N
4287d3cc-2fe6-4d89-b210-611dfed151e8	0a5e5647-1b01-484b-8255-8aa5c44b8352	t	SUBMITTED	\N	\N
4287d3cc-2fe6-4d89-b210-611dfed151e8	af7f879d-d231-4c32-9541-1c211c502f38	f	SUBMITTED	\N	\N
2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	96461f20-d533-400a-aa08-0a622e429d51	t	SUBMITTED	\N	\N
2bf0e86d-fd4c-4229-99f3-f4f326e6d28f	d60e8660-8f36-4409-8a1f-278aa2e7e543	f	SUBMITTED	\N	\N
db8d3992-1bb3-4f88-b164-de033ba3a7f9	e6cdca11-225a-4ebb-a155-3fd14d4f7c47	t	SUBMITTED	\N	\N
db8d3992-1bb3-4f88-b164-de033ba3a7f9	f78e9a40-a66c-40dd-8cca-505317ed6404	f	SUBMITTED	\N	\N
3a6cb924-bff0-4774-8c25-9c0f6e82898c	66d3185f-c890-4600-8ea9-0e6ae7d67c37	t	SUBMITTED	\N	\N
3a6cb924-bff0-4774-8c25-9c0f6e82898c	72aa7d48-17b8-485e-a3e1-f280f0121226	f	SUBMITTED	\N	\N
46599cfa-2de4-429e-a5db-c3d1e806509c	c369821a-c8b8-42cd-b25c-57f3f4c6787b	t	SUBMITTED	\N	\N
46599cfa-2de4-429e-a5db-c3d1e806509c	8a9f1fe1-c092-4415-a400-ee6825a65b62	f	SUBMITTED	\N	\N
f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	8a43ed2e-3a93-4ef1-bb51-2d3f8ddac193	t	SUBMITTED	\N	\N
f3027dc7-e0b5-43d6-b457-2266f7b8d8e8	6c9c3ecb-c5f2-4be4-8b86-3231e4281d8e	f	SUBMITTED	\N	\N
46e19ebf-e200-4887-80fc-dffeaa6117a2	0d823321-e69a-4f1e-896f-e4400b984546	t	SUBMITTED	\N	\N
46e19ebf-e200-4887-80fc-dffeaa6117a2	39301089-3e6e-42e7-a25d-28d692f03051	f	SUBMITTED	\N	\N
af5f38c0-5ce0-41a0-ab57-a692d3ef070a	a0b0dfb3-3bef-4dd7-9386-6942e884b223	t	SUBMITTED	\N	\N
af5f38c0-5ce0-41a0-ab57-a692d3ef070a	88511bf3-a7d7-4318-b9c7-64b13b36ba40	f	SUBMITTED	\N	\N
a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	74dfe834-aea0-4442-82cd-15faf9943dc5	t	SUBMITTED	\N	\N
a21fe26e-25c1-4c3a-91ba-9c00a85c74b7	71288b58-62d4-4cae-9d89-83e3fc91aca6	f	SUBMITTED	\N	\N
10e8fa4c-6e7c-4d98-9ca3-759011269529	9b873340-d10d-4465-ba60-c8831b17a3b7	t	SUBMITTED	\N	\N
10e8fa4c-6e7c-4d98-9ca3-759011269529	a72eadd7-7e2d-4c20-8adf-be2a27df1140	f	SUBMITTED	\N	\N
10e8fa4c-6e7c-4d98-9ca3-759011269529	6b939f39-a109-4ed4-b8f9-5f9cfc782ea3	f	SUBMITTED	\N	\N
1ede9d10-6eda-45ef-828e-ce36ccd50335	c8b2ca97-28f0-46e8-acb2-65babbe0b84a	t	SUBMITTED	\N	\N
1ede9d10-6eda-45ef-828e-ce36ccd50335	91d0d488-6f35-4b85-ba4a-1ed4411a7e0b	f	SUBMITTED	\N	\N
1ede9d10-6eda-45ef-828e-ce36ccd50335	19ca0bb7-3514-4a5e-a047-83d383bab26b	f	SUBMITTED	\N	\N
e7f98a72-73f1-42eb-b646-d9b8e73cd6fb	bb9a5264-da76-4bfb-a8f4-631aa4e92068	t	SUBMITTED	\N	\N
55814a86-67d7-45db-a89d-321c3110acce	f90b34f2-19b7-47ad-aad1-3f95280935ce	t	SUBMITTED	\N	\N
41e3234c-a1f2-4b58-978b-6e576dbd0426	66f0301b-f6d8-493b-89c5-389d092d460c	t	SUBMITTED	\N	\N
be3e05e7-629f-41ed-bfb3-be1ef4fccd4d	8a8bf8b1-9bdb-4364-8862-eea1cadd4e1a	t	SUBMITTED	\N	\N
7dde533d-dc0b-4b52-b240-2411c6a9f153	9e436ba1-8ab4-4776-928b-6dc7f5602b9c	t	SUBMITTED	\N	\N
9bbf90cf-b597-4ab1-b0df-906fd7f9b13e	58c1600f-90ea-4bbb-ac20-a54fba6b6e09	t	SUBMITTED	\N	\N
ed44c96f-7c9b-42a9-a4a3-8384c1315278	c6fd89e8-094c-41a2-8163-b3df78128e81	t	SUBMITTED	\N	\N
df6c80f8-d894-41db-ab31-309852b7a990	0e233735-eadb-4989-8b6f-1818a359817d	t	SUBMITTED	\N	\N
33db54f5-71d1-4cf6-a646-88e176f014f0	5e21e48b-dc8b-4ce6-a8f6-ce08beee0c7f	t	SUBMITTED	\N	\N
8ee804df-531a-47e2-8915-4774afc8b916	f994c038-80b4-413d-b769-1b7a450e3970	t	SUBMITTED	\N	\N
e1d21deb-0e62-45e9-aed6-01770a111d62	2ee3a62f-e5a3-416e-ae59-1502a697efdc	t	SUBMITTED	\N	\N
873035ba-169f-49b9-9dc4-4a84be8329a9	af267efb-bd47-410e-bcdc-1a13c0316380	t	SUBMITTED	\N	\N
e070f4c0-8816-4de5-90b9-2c31b6c66154	c9f4a0cf-5739-4562-b7a2-b16315bc1789	t	SUBMITTED	\N	\N
5e3c3cc7-407e-4bce-b712-1b76555c3ed3	db30cd37-52bb-4687-90af-9a95cf39d937	t	SUBMITTED	\N	\N
717efd71-f0b7-4b22-9163-6d01d533ac92	d9ef809e-0c20-43c5-aaf3-1e333a52683d	t	SUBMITTED	\N	\N
cabcc9f3-0efe-4a2c-81d0-cb8cf0062b84	997c2907-9726-4d22-8566-66c505df8d6b	t	SUBMITTED	\N	\N
0fdd044b-51c2-41b0-b0e1-2ba65475ac26	8a6fbb66-1a07-4cba-b828-465d625a2c36	t	SUBMITTED	\N	\N
3a895f19-31bf-4618-935e-c101f376ecf3	de58e366-0a30-4f4f-a35d-dae49b4f600d	t	SUBMITTED	\N	\N
661607f9-a141-4e3d-94b8-43f73c5dee19	36fbd438-ed66-4a71-b401-ea630a09ba71	t	SUBMITTED	\N	\N
7d6706f9-6221-4d8d-a0d7-afcfb04234d2	cbbe770a-9a7b-4846-aae7-d01a800db9b1	t	SUBMITTED	\N	\N
b7d013cd-fff5-48d9-9a32-229de40b2c6d	43407c0f-7501-4119-ae47-542249d573c9	t	SUBMITTED	\N	\N
9649038f-3080-4a68-8c60-47511ad0b14a	bd835c77-4c61-43ae-baba-7e142bb64ca1	t	SUBMITTED	\N	\N
59430714-fc01-4058-aab0-3097d9810cfb	659fff5b-eea9-4456-a742-d308d7582997	t	SUBMITTED	\N	\N
d1a5cf8e-46c2-4827-a19e-7209327e4173	534dee14-0e40-42c6-a6af-5facad252786	t	SUBMITTED	\N	\N
34d06c77-839d-410b-b4db-50051a6b2133	587bcf6c-4ca6-43f7-a153-1e6529d0ca82	t	SUBMITTED	\N	\N
903e524e-6d37-4625-857d-30fa6ae2f84e	3abb916e-76ab-46dd-997c-35af38863bad	t	SUBMITTED	\N	\N
1bffbd38-aa29-480d-a9a0-1a9879aa6cb7	f32789c5-207c-4b6d-a934-a5e8a36fe02f	t	SUBMITTED	\N	\N
f176c22c-a0df-45a6-bfb1-e9ba1d8a230f	dc303dd0-7af4-4006-adfb-3c8fc5225686	t	SUBMITTED	\N	\N
7ed38af3-f560-42dd-8c8c-9f22219b87d6	ac0a5044-a1df-4f0a-8a4d-ffdf06dc6f81	t	SUBMITTED	\N	\N
5b9bac04-83a6-4453-bc40-f2aca1db38b7	bcf8c33b-19a9-4b5d-bb2f-bb08dcde5258	t	SUBMITTED	\N	\N
cca57dfa-2e9b-4abd-a099-040e8c29d6f6	a954ceb8-6cd9-48b9-8573-1ee095669cfb	t	SUBMITTED	\N	\N
41bdc582-a7d6-4f2a-b610-180071957164	a0d51f7f-b57c-45e1-9556-77f980173dd4	t	SUBMITTED	\N	\N
ea606f7d-ed67-4005-b577-c6fda3a7b4b8	f9c21b0d-3b37-41ea-9eed-abaa56641bc7	t	SUBMITTED	\N	\N
3985cab0-06b4-47a1-b541-04dd6fd4af3c	2332f686-814d-494d-846c-80b60febe3cb	t	SUBMITTED	\N	\N
0dd71fdf-5272-4307-8106-c99b224bb402	d4e5d3d9-2c89-4f23-8b45-76461c1c5abf	t	SUBMITTED	\N	\N
75617195-bd22-4580-953a-0f1a7a054672	47880a79-041d-464f-a931-51629cca3436	t	SUBMITTED	\N	\N
677ef96c-28f2-459d-b5e3-2b958a7596cc	402e1e33-6231-41d3-92a6-24496141fa00	t	SUBMITTED	\N	\N
e2c44222-5c45-4fd0-aed9-2bcc5db16e10	6d78dbbf-e7af-44c1-9072-15de3b1588e7	t	SUBMITTED	\N	\N
5453c775-cd55-4150-8282-d42e6814b265	2636f682-fafb-413f-ad2a-3cf85d8a8d13	t	SUBMITTED	\N	\N
1c9321b3-427b-4477-a9f7-30b8af6bc390	6aa15961-4706-45fb-9610-77eebdc5c577	t	SUBMITTED	\N	\N
423d7e89-eadf-4553-8945-045c0e58846c	6a1d38b5-06dc-4112-86bd-97561d6c474e	t	SUBMITTED	\N	\N
32425ca8-52bb-4a51-bba1-38119bc2d40c	e53d9ebc-d012-42ee-b9ff-1c2e37918936	t	SUBMITTED	\N	\N
70a93ddb-0840-46a3-a051-20a262de3c57	454ae142-f647-4335-956c-03b247aed2ba	t	SUBMITTED	\N	\N
56effa19-8f4c-45c7-b537-89561b9f91f3	8579cf1c-a557-4471-b315-d8c6fc7d9f4e	t	SUBMITTED	\N	\N
568578dc-37ce-4e1d-bd5b-18a961015fee	bd665a05-6a92-4efd-85dc-f68706d31455	t	SUBMITTED	\N	\N
\.


--
-- Data for Name: ScanAttempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ScanAttempt" (id, "eventId", "credentialId", "scannedById", result, "rawTokenScanned", "scannedAt") FROM stdin;
eeba3cb6-6c4e-4624-bbf7-cc7598ed2f49	3060ac34-2f98-4cc9-928c-bd5cffcab094	4a5dd9d3-d401-455d-ad3a-14ec8703a6a0	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_6382d6ffe5b4547cb525adb294d53e5f68be09389c314ebe7992716cafc7939c	2026-08-24 11:37:46.968
c11bb484-826d-4651-ab7f-06cfb03962be	3060ac34-2f98-4cc9-928c-bd5cffcab094	3b9106e2-e42b-47c5-956c-5eab4f8eaba0	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_490cab3c3f6cbda034e1cda9ecfab63b4a7e061796da093ff6ee3b48a9c7dce9	2026-08-24 11:37:46.993
99fb3021-1d2f-42f7-84ce-b2897479488e	3060ac34-2f98-4cc9-928c-bd5cffcab094	e50223cc-d103-41ad-94a6-d9e4b59c1321	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_fb919380203062b92ef4becf8e4376a5a6762c6e447e01cff2a213d1a84b68cd	2026-08-24 11:37:47.014
2cdf5cf2-d3b8-49ce-901c-4bc38c25f670	3060ac34-2f98-4cc9-928c-bd5cffcab094	75cbb946-5ea0-4b77-817b-5d3b7b762f18	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_8f914b3ac1db07042e60640d897d866d6c456d215b37a28913f9d0dfbaad3926	2026-08-24 11:37:47.032
a0f05872-66ad-4dd5-adea-eb8fe5b67976	3060ac34-2f98-4cc9-928c-bd5cffcab094	74ca4792-e0fa-4b4c-a279-f7024766e5ee	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_3758b610b004af79ab81dceaf880deadd556012fd504f2e44f8780dd4ced5152	2026-08-24 11:37:47.053
bda77c3b-e5ac-43ca-9918-e2d45a24c049	3060ac34-2f98-4cc9-928c-bd5cffcab094	180d257b-c8ee-405a-a331-511ce183f184	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_33e1b5b2402f1a1184f54b7dc84471bca3b1d8d3c4a8f43290606897e470c956	2026-08-24 11:37:47.074
26536657-3ba9-4e5e-8e91-3f4e221a6748	3060ac34-2f98-4cc9-928c-bd5cffcab094	9198adfa-a802-4e91-9c3a-16dea2f2afef	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_e0286ee452f4e0f039ba12fd1509064da6050416a3f18355b4032289ae82cee4	2026-08-24 11:37:47.093
a8d42a70-59c7-49f1-92d4-1e8450bf1fd7	3060ac34-2f98-4cc9-928c-bd5cffcab094	dedf57ca-86e6-40de-be96-498f6a25e35a	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_96cf2ae3dab6955455bf8a865fda62812cd77486507cc10cf026fe2439b319fb	2026-08-24 11:37:47.114
b390afb4-8836-4611-bf12-e2894fccef79	3060ac34-2f98-4cc9-928c-bd5cffcab094	13507ea6-3d41-4909-9fbd-739c3dc3228a	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_ec1c0ec4935f1aa13debad475eff98722c8638e26c1b2ded685c9879e03d1702	2026-08-24 11:37:47.134
e6c826ff-0665-4f5a-895e-206c31fb7fdb	3060ac34-2f98-4cc9-928c-bd5cffcab094	4ca6d08f-a179-4ea4-b0ab-cb8c404cf920	1e1b2563-468f-4b9a-9612-c05e43b519a3	VALID	ss_qr_59f704605378346b4f9978c25de414ad47a06ebe28079551b43022cf22668a02	2026-08-24 11:37:47.152
\.


--
-- Data for Name: SponsorInquiry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SponsorInquiry" (id, "companyName", "contactName", phone, email, "sponsorshipType", notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StallInquiry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StallInquiry" (id, "brandName", "contactName", phone, category, notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemSetting" (key, value) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, username, "passwordHash", "fullName", role, "isActive", "createdAt", "updatedAt") FROM stdin;
761a2b29-f2ed-4b53-af34-b0754012fad8	admin@safedsheri.com	a44ca5d29f6dab4320ab986479fa985b2d584b11a7da934f7e80bb1449913a07	Vikramaditya Solanki (Super Admin)	SUPER_ADMIN	t	2026-08-24 11:37:46.646	2026-08-24 11:37:46.646
d0abdb89-edd3-4c07-b2ae-ed41855e9b37	cashier1@safedsheri.com	e1d0c45d0341d46f42fa53d31f59a6fede1ca205a760e43544acc35878e3525a	Aarav Mehta (Cashier Executive)	TICKETING_FINANCE	t	2026-08-24 11:37:46.648	2026-08-24 11:37:46.648
1e1b2563-468f-4b9a-9612-c05e43b519a3	gate1@safedsheri.com	7bbb7c326190562c1330e8d70fc395c8b5870bb2d4769085ef6fd498d1557820	Digvijay Jadeja (Gate Verification Lead)	ENTRY_VERIFICATION	t	2026-08-24 11:37:46.65	2026-08-24 11:37:46.65
\.


--
-- Name: AadhaarDocument AadhaarDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AadhaarDocument"
    ADD CONSTRAINT "AadhaarDocument_pkey" PRIMARY KEY (id);


--
-- Name: Attendee Attendee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendee"
    ADD CONSTRAINT "Attendee_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Credential Credential_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credential"
    ADD CONSTRAINT "Credential_pkey" PRIMARY KEY (id);


--
-- Name: Entry Entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: GazeboInquiry GazeboInquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GazeboInquiry"
    ADD CONSTRAINT "GazeboInquiry_pkey" PRIMARY KEY (id);


--
-- Name: Gazebo Gazebo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Gazebo"
    ADD CONSTRAINT "Gazebo_pkey" PRIMARY KEY (id);


--
-- Name: PaymentLocation PaymentLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentLocation"
    ADD CONSTRAINT "PaymentLocation_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PricingPhase PricingPhase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PricingPhase"
    ADD CONSTRAINT "PricingPhase_pkey" PRIMARY KEY (id);


--
-- Name: RegistrationAttendee RegistrationAttendee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationAttendee"
    ADD CONSTRAINT "RegistrationAttendee_pkey" PRIMARY KEY ("registrationId", "attendeeId");


--
-- Name: Registration Registration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_pkey" PRIMARY KEY (id);


--
-- Name: ScanAttempt ScanAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScanAttempt"
    ADD CONSTRAINT "ScanAttempt_pkey" PRIMARY KEY (id);


--
-- Name: SponsorInquiry SponsorInquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SponsorInquiry"
    ADD CONSTRAINT "SponsorInquiry_pkey" PRIMARY KEY (id);


--
-- Name: StallInquiry StallInquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StallInquiry"
    ADD CONSTRAINT "StallInquiry_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (key);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AadhaarDocument_attendeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AadhaarDocument_attendeeId_idx" ON public."AadhaarDocument" USING btree ("attendeeId");


--
-- Name: AadhaarDocument_attendeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AadhaarDocument_attendeeId_key" ON public."AadhaarDocument" USING btree ("attendeeId");


--
-- Name: Attendee_aadhaarHmac_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendee_aadhaarHmac_idx" ON public."Attendee" USING btree ("aadhaarHmac");


--
-- Name: Attendee_aadhaarHmac_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Attendee_aadhaarHmac_key" ON public."Attendee" USING btree ("aadhaarHmac");


--
-- Name: Attendee_fullName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendee_fullName_idx" ON public."Attendee" USING btree ("fullName");


--
-- Name: Attendee_gender_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendee_gender_idx" ON public."Attendee" USING btree (gender);


--
-- Name: Attendee_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendee_phone_idx" ON public."Attendee" USING btree (phone);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_actorId_idx" ON public."AuditLog" USING btree ("actorId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_targetEntity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_targetEntity_idx" ON public."AuditLog" USING btree ("targetEntity");


--
-- Name: Credential_attendeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credential_attendeeId_idx" ON public."Credential" USING btree ("attendeeId");


--
-- Name: Credential_credentialNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credential_credentialNumber_idx" ON public."Credential" USING btree ("credentialNumber");


--
-- Name: Credential_credentialNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Credential_credentialNumber_key" ON public."Credential" USING btree ("credentialNumber");


--
-- Name: Credential_passCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credential_passCode_idx" ON public."Credential" USING btree ("passCode");


--
-- Name: Credential_passCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Credential_passCode_key" ON public."Credential" USING btree ("passCode");


--
-- Name: Credential_secureToken_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credential_secureToken_idx" ON public."Credential" USING btree ("secureToken");


--
-- Name: Credential_secureToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Credential_secureToken_key" ON public."Credential" USING btree ("secureToken");


--
-- Name: Credential_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credential_status_idx" ON public."Credential" USING btree (status);


--
-- Name: Entry_attendeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_attendeeId_idx" ON public."Entry" USING btree ("attendeeId");


--
-- Name: Entry_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_createdAt_idx" ON public."Entry" USING btree ("createdAt");


--
-- Name: Entry_credentialId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_credentialId_idx" ON public."Entry" USING btree ("credentialId");


--
-- Name: Entry_eventId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_eventId_idx" ON public."Entry" USING btree ("eventId");


--
-- Name: Entry_registrationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_registrationId_idx" ON public."Entry" USING btree ("registrationId");


--
-- Name: Entry_verifiedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Entry_verifiedById_idx" ON public."Entry" USING btree ("verifiedById");


--
-- Name: Event_eventDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Event_eventDate_idx" ON public."Event" USING btree ("eventDate");


--
-- Name: Event_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Event_status_idx" ON public."Event" USING btree (status);


--
-- Name: GazeboInquiry_inquiryNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GazeboInquiry_inquiryNumber_idx" ON public."GazeboInquiry" USING btree ("inquiryNumber");


--
-- Name: GazeboInquiry_inquiryNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GazeboInquiry_inquiryNumber_key" ON public."GazeboInquiry" USING btree ("inquiryNumber");


--
-- Name: GazeboInquiry_level_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GazeboInquiry_level_idx" ON public."GazeboInquiry" USING btree (level);


--
-- Name: GazeboInquiry_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GazeboInquiry_status_idx" ON public."GazeboInquiry" USING btree (status);


--
-- Name: Gazebo_gazeboNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Gazebo_gazeboNumber_key" ON public."Gazebo" USING btree ("gazeboNumber");


--
-- Name: Gazebo_level_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Gazebo_level_idx" ON public."Gazebo" USING btree (level);


--
-- Name: Gazebo_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Gazebo_status_idx" ON public."Gazebo" USING btree (status);


--
-- Name: PaymentLocation_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentLocation_isActive_idx" ON public."PaymentLocation" USING btree ("isActive");


--
-- Name: Payment_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_createdAt_idx" ON public."Payment" USING btree ("createdAt");


--
-- Name: Payment_providerReference_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_providerReference_idx" ON public."Payment" USING btree ("providerReference");


--
-- Name: Payment_providerReference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_providerReference_key" ON public."Payment" USING btree ("providerReference");


--
-- Name: Payment_receiptNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_receiptNumber_idx" ON public."Payment" USING btree ("receiptNumber");


--
-- Name: Payment_receiptNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON public."Payment" USING btree ("receiptNumber");


--
-- Name: Payment_registrationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_registrationId_idx" ON public."Payment" USING btree ("registrationId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: PricingPhase_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PricingPhase_isActive_idx" ON public."PricingPhase" USING btree ("isActive");


--
-- Name: PricingPhase_phaseName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PricingPhase_phaseName_key" ON public."PricingPhase" USING btree ("phaseName");


--
-- Name: RegistrationAttendee_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RegistrationAttendee_status_idx" ON public."RegistrationAttendee" USING btree (status);


--
-- Name: Registration_eventId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_eventId_idx" ON public."Registration" USING btree ("eventId");


--
-- Name: Registration_passType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_passType_idx" ON public."Registration" USING btree ("passType");


--
-- Name: Registration_paymentLinkId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_paymentLinkId_idx" ON public."Registration" USING btree ("paymentLinkId");


--
-- Name: Registration_paymentLinkId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Registration_paymentLinkId_key" ON public."Registration" USING btree ("paymentLinkId");


--
-- Name: Registration_pricingPhaseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_pricingPhaseId_idx" ON public."Registration" USING btree ("pricingPhaseId");


--
-- Name: Registration_registrationNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_registrationNumber_idx" ON public."Registration" USING btree ("registrationNumber");


--
-- Name: Registration_registrationNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Registration_registrationNumber_key" ON public."Registration" USING btree ("registrationNumber");


--
-- Name: Registration_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Registration_status_idx" ON public."Registration" USING btree (status);


--
-- Name: ScanAttempt_credentialId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScanAttempt_credentialId_idx" ON public."ScanAttempt" USING btree ("credentialId");


--
-- Name: ScanAttempt_eventId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScanAttempt_eventId_idx" ON public."ScanAttempt" USING btree ("eventId");


--
-- Name: ScanAttempt_result_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScanAttempt_result_idx" ON public."ScanAttempt" USING btree (result);


--
-- Name: ScanAttempt_scannedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScanAttempt_scannedAt_idx" ON public."ScanAttempt" USING btree ("scannedAt");


--
-- Name: ScanAttempt_scannedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScanAttempt_scannedById_idx" ON public."ScanAttempt" USING btree ("scannedById");


--
-- Name: SponsorInquiry_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SponsorInquiry_status_idx" ON public."SponsorInquiry" USING btree (status);


--
-- Name: StallInquiry_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StallInquiry_status_idx" ON public."StallInquiry" USING btree (status);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_username_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_username_idx" ON public."User" USING btree (username);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: AadhaarDocument AadhaarDocument_attendeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AadhaarDocument"
    ADD CONSTRAINT "AadhaarDocument_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES public."Attendee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Credential Credential_attendeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credential"
    ADD CONSTRAINT "Credential_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES public."Attendee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Credential Credential_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credential"
    ADD CONSTRAINT "Credential_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Entry Entry_attendeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES public."Attendee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Entry Entry_credentialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES public."Credential"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Entry Entry_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Entry Entry_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Entry Entry_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entry"
    ADD CONSTRAINT "Entry_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GazeboInquiry GazeboInquiry_gazeboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GazeboInquiry"
    ADD CONSTRAINT "GazeboInquiry_gazeboId_fkey" FOREIGN KEY ("gazeboId") REFERENCES public."Gazebo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_collectedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_paymentLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_paymentLocationId_fkey" FOREIGN KEY ("paymentLocationId") REFERENCES public."PaymentLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RegistrationAttendee RegistrationAttendee_attendeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationAttendee"
    ADD CONSTRAINT "RegistrationAttendee_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES public."Attendee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RegistrationAttendee RegistrationAttendee_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationAttendee"
    ADD CONSTRAINT "RegistrationAttendee_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public."Registration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Registration Registration_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_pricingPhaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_pricingPhaseId_fkey" FOREIGN KEY ("pricingPhaseId") REFERENCES public."PricingPhase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_reviewedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScanAttempt ScanAttempt_credentialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScanAttempt"
    ADD CONSTRAINT "ScanAttempt_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES public."Credential"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScanAttempt ScanAttempt_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScanAttempt"
    ADD CONSTRAINT "ScanAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScanAttempt ScanAttempt_scannedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScanAttempt"
    ADD CONSTRAINT "ScanAttempt_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 8KwPd5vjM4wAXBF7rlxPrVcNiV2MLL2GRJCjfWIUEM0jlAhrnCmfN4T4aZjUOA8

