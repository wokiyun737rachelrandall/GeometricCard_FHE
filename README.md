# GeometricCard_FHE

A secure multi-party computation library enabling **private geometric intersection cardinality** analysis using Fully Homomorphic Encryption (FHE). Participants can compute the size of intersections (area, volume) of their geometric shapes without exposing individual data, preserving privacy while enabling collaborative spatial analysis.

## Project Background

Computing geometric intersections between datasets from multiple parties presents challenges:

* Directly sharing geometric data can reveal sensitive design or spatial information
* Collaboration in urban planning, CAD, or environmental studies is often limited by privacy concerns
* Existing methods either expose raw data or require a trusted central server

GeometricCard_FHE addresses these challenges by performing encrypted computations on participant geometries:

* Each party encrypts their geometric shapes before computation
* FHE allows computations directly on encrypted data without revealing individual geometries
* Intersection sizes are revealed only after secure aggregation, protecting individual datasets
* Supports area, volume, and higher-dimensional intersection metrics

## Features

### Core Functionality

* **Encrypted Geometry Submission:** Participants submit encrypted geometric data
* **Intersection Computation:** Calculates intersection cardinality without decrypting input shapes
* **Multi-Party Support:** Works with multiple collaborators simultaneously
* **Area and Volume Metrics:** Computes size metrics for 2D and 3D geometries
* **Privacy-Preserving Results:** Only aggregated intersection sizes are revealed

### Data Security

* **Fully Homomorphic Encryption (FHE):** Enables computations on encrypted geometries
* **Immutable Submission:** Geometric data cannot be altered once submitted
* **Secure Aggregation:** Ensures intermediate computation values remain encrypted
* **Participant Anonymity:** Individual geometries remain confidential throughout the process

### Usage Scenarios

* **Urban Planning:** Safely compute overlapping zones from multiple agencies
* **CAD Collaboration:** Assess shared design components without exposing full CAD models
* **Environmental Analysis:** Calculate intersecting protected areas or land parcels across organizations
* **Research:** Private geometric datasets can be analyzed collaboratively without disclosure

## Architecture

### FHE Computation Engine

* Performs geometric intersection cardinality calculations directly on encrypted shapes
* Supports 2D polygons, 3D polyhedra, and higher-dimensional shapes
* Outputs are encrypted until final aggregation and optional decryption

### Backend Services

* Handles encrypted submissions and orchestrates multi-party computations
* Stores encrypted datasets securely
* Maintains immutable audit logs for reproducibility and traceability

### Frontend Application

* **React + TypeScript:** Interactive dashboard for submitting encrypted shapes and viewing results
* **Visualization Tools:** Render aggregated intersection areas securely
* **Real-Time Updates:** Track computation progress across multiple participants
* **Query & Filter:** Explore intersections by shape categories or participant groups

## Technology Stack

### Encryption & Computation

* **Fully Homomorphic Encryption Libraries:** Enables private geometric computations
* **Secure Serialization:** Converts geometric datasets into FHE-compatible formats

### Frontend

* **React 18 + TypeScript:** Modern interactive UI
* **Canvas / WebGL Rendering:** Display aggregated intersections
* **Tailwind CSS:** Responsive design and layout

### Backend

* **Node.js / TypeScript:** Orchestrates computation pipelines and dataset management
* **Encrypted Storage:** Stores participant shapes and results securely
* **Audit Logging:** Immutable logs for all submissions and computations

## Installation

### Prerequisites

* Node.js 18+ environment
* npm / yarn / pnpm package manager
* Access to participant geometric datasets
* Adequate computational resources for FHE operations

### Setup Steps

1. Clone the repository and install dependencies
2. Configure encrypted storage locations for geometric datasets
3. Initialize FHE computation engine
4. Launch frontend dashboard for encrypted intersection analysis

## Usage

* **Submit Encrypted Shapes:** Each participant encrypts and uploads their geometries
* **Request Intersection Computation:** Initiate secure FHE-based intersection calculations
* **Visualize Results:** Aggregated intersection metrics displayed without revealing individual shapes
* **Export Aggregated Data:** Download intersection sizes for reporting or further analysis
* **Collaboration:** Support multi-party computation without sharing raw data

## Security & Privacy

* All computations occur on encrypted data, preventing disclosure of individual shapes
* Participant geometries remain confidential throughout the computation pipeline
* Immutable logs ensure accountability and reproducibility
* Aggregated results prevent leakage of sensitive design or spatial information

## Roadmap & Future Enhancements

* **Optimized FHE Computation:** Improve efficiency for large-scale or complex geometries
* **Higher-Dimensional Support:** Extend to 4D+ geometric analyses
* **AI-Assisted Intersection Detection:** Apply machine learning on encrypted geometric data
* **Cross-Platform Collaboration:** Enable secure computations across distributed systems
* **Mobile-Friendly Dashboard:** Visualize intersections and computation progress on tablets or smartphones

GeometricCard_FHE empowers multiple parties to collaboratively analyze geometric intersections securely, preserving privacy while enabling critical urban planning, CAD design, and environmental applications.
